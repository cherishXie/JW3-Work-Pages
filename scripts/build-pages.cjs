/* Build a deliberately small, public-only GitHub Pages artifact.
 * Never publish the repository root or the generated JX3_Workbench.html.
 * User archives belong in browser storage and are never build inputs.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, '.pages-dist');

// Explicit, reviewed public source allowlist. Do not add any personal data files.
const {ocrAssets,publicFiles,publicDocuments}=require('./public-assets.cjs');
const allowed = new Set(publicFiles);

function assertSafeSource(relative) {
  if (!/^[a-zA-Z0-9_.\/-]+$/.test(relative) ||
      path.isAbsolute(relative) || relative.split('/').includes('..') ||
      !/\.(?:html|css|js)$/.test(relative) && !Object.hasOwn(ocrAssets, relative) && !publicDocuments.includes(relative)) {
    throw new Error('Unsafe public source: ' + relative);
  }
  let current = root;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink()) throw new Error('Symlink not allowed: ' + relative);
  }
  if (!fs.statSync(current).isFile()) throw new Error('Not a regular file: ' + relative);
  if (ocrAssets[relative] && require('node:crypto').createHash('sha256').update(fs.readFileSync(current)).digest('hex') !== ocrAssets[relative]) throw new Error('OCR asset checksum mismatch: '+relative);
  return current;
}

function validateDependencies() {
  const html = fs.readFileSync(assertSafeSource('index.html'), 'utf8');
  const references = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
    .map(match => match[1])
    .filter(url => !url.startsWith('data:') && !url.startsWith('#'));
  const referenced = new Set();
  for (const url of references) {
    if (/^(?:https?:)?\/\//i.test(url)) throw new Error('External page resource: ' + url);
    const file = url.split(/[?#]/)[0].replace(/^\.\//, '');
    if (!allowed.has(file) || file === 'index.html') {
      throw new Error('Unreviewed asset referenced by index.html: ' + file);
    }
    referenced.add(file);
  }
  for (const file of publicFiles) {
    if (file !== 'index.html' && !Object.hasOwn(ocrAssets,file) && !referenced.has(file)) {
      throw new Error('Public asset is not referenced by index.html: ' + file);
    }
  }
  if (/<script\b(?![^>]*\bsrc\s*=)[^>]*>/i.test(html)) {
    throw new Error('Inline HTML scripts require security review before publishing');
  }
  const css = fs.readFileSync(assertSafeSource('styles.css'), 'utf8');
  if (/@import\b|url\s*\(/i.test(css)) {
    throw new Error('CSS imports/URLs require review before publishing');
  }
  for (const file of publicFiles.filter(name => name.endsWith('.js') && !Object.hasOwn(ocrAssets,name))) {
    const js = fs.readFileSync(assertSafeSource(file), 'utf8');
    if (/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\s*\(/i.test(js)) {
      throw new Error('Network API introduced in public script; review privacy: ' + file);
    }
  }
}

validateDependencies();
fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(out, {recursive: true});

for (const file of [...publicFiles, ...publicDocuments]) {
  const source = assertSafeSource(file);
  const destination = path.join(out, file);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.copyFileSync(source, destination);
}
fs.writeFileSync(path.join(out, '.nojekyll'), '');

function walk(dir, prefix = '') {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(item => {
    const relative = prefix ? prefix + '/' + item.name : item.name;
    if (item.isDirectory()) return walk(path.join(dir, item.name), relative);
    if (!item.isFile()) throw new Error('Unexpected artifact file type: ' + relative);
    return [relative];
  });
}
const actual = new Set(walk(out));
const expected = new Set([...publicFiles, ...publicDocuments, '.nojekyll']);
if (actual.size !== expected.size || [...actual].some(file => !expected.has(file))) {
  throw new Error('Unexpected file in Pages artifact');
}
console.log('Safe Pages artifact prepared: ' + (publicFiles.length + publicDocuments.length) + ' public files, no data/docs/output.');
