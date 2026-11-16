'use strict';
// Local-only evaluation. Private inputs and reports are never public assets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const S = require('../screenshot');
const root = path.resolve(__dirname, '..');
const privateRoots = ['data', 'output'].map(name => path.join(root, name) + path.sep);
const variants = [
  {id: 'original', scale: 1},
  {id: 'scale-075', scale: .75},
  {id: 'scale-150', scale: 1.5},
  {id: 'jpeg-075', scale: 1, quality: .75}
];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function privatePath(input) {
  const resolved = path.resolve(input);
  if (!privateRoots.some(prefix => resolved.startsWith(prefix))) throw Error('Paths must be under data/ or output/');
  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const real = path.join(fs.realpathSync(ancestor), path.relative(ancestor, resolved));
  if (!privateRoots.some(prefix => real.startsWith(prefix))) throw Error('Private paths must not escape through symlinks');
  return real;
}
function selectVariants(filter) {
  if (filter === undefined) return variants;
  const names = filter.split(',');
  if (new Set(names).size !== names.length || names.some(id => !variants.some(v => v.id === id))) throw Error('Unknown, duplicate or empty OCR variant');
  return variants.filter(v => names.includes(v.id));
}
function validateAnnotations(labels) {
  if (!Array.isArray(labels.images) || !labels.images.length) throw Error('annotations.images must be nonempty');
  if (labels.roles !== undefined && !Array.isArray(labels.roles)) throw Error('roles must be an array');
  const roles = labels.roles || [], roleIds = new Set();
  for (const role of roles) {
    if (typeof role.id !== 'string' || !role.id || roleIds.has(role.id) || typeof role.name !== 'string' || !role.name.trim()) throw Error('Roles need unique IDs and nonempty names');
    roleIds.add(role.id);
  }
  const ids = new Set();
  for (const image of labels.images) {
    if (typeof image.id !== 'string' || !image.id || ids.has(image.id)) throw Error('Images need unique nonempty IDs');
    ids.add(image.id);
    if (typeof image.file !== 'string' || !/\.(png|jpe?g)$/i.test(image.file)) throw Error('Image file must be PNG or JPEG');
    if (!Array.isArray(image.rows) || !image.rows.length) throw Error('Each image needs labeled rows');
    if (image.expectedRowCount !== undefined && (!Number.isInteger(image.expectedRowCount) || image.expectedRowCount < 1)) throw Error('Invalid expectedRowCount');
    const top = image.top ?? 23, bottom = image.bottom ?? 92;
    if (!Number.isFinite(top) || !Number.isFinite(bottom) || top < 0 || bottom > 100 || top >= bottom) throw Error('Invalid crop percentages');
    const indexes = new Set();
    for (const row of image.rows) {
      if (!Number.isInteger(row.index) || row.index < 0 || indexes.has(row.index) || (image.expectedRowCount !== undefined && row.index >= image.expectedRowCount)) throw Error('Invalid or duplicate row index');
      indexes.add(row.index);
      if (!row.fields || Array.isArray(row.fields) || typeof row.fields !== 'object' || !Object.keys(row.fields).length) throw Error('Labeled rows need nonempty fields');
      for (const [field, expected] of Object.entries(row.fields)) {
        if (!S.fields.includes(field) || !['string', 'number'].includes(typeof expected) || !String(expected).trim()) throw Error('Invalid field annotation');
        if (field !== 'name' && field !== 'school') S.value(expected, field);
      }
      if (row.expectedRoleId !== undefined && row.expectedRoleId !== '' && !roleIds.has(row.expectedRoleId)) throw Error('expectedRoleId is missing from roles');
    }
  }
}
function compareFields(image, result) {
  return image.rows.flatMap(row => Object.entries(row.fields).map(([field, expected]) => {
    const actual = result.rows[row.index]?.[field];
    const blank = actual == null || String(actual).trim() === '';
    const equal = field === 'gold' ? Number(actual) === Number(expected) : String(actual ?? '').normalize('NFC').trim() === String(expected).normalize('NFC').trim();
    return {row: row.index + 1, field, expected, actual: actual ?? null,
      status: result.error ? 'unavailable' : blank ? 'blank' : equal ? 'correct' : 'wrong'};
  }));
}
function compareMatches(image, result, roles) {
  return image.rows.filter(row => row.expectedRoleId !== undefined).map(annotation => {
    const row = result.rows[annotation.index] || {};
    const match = S.suggestRoles(roles, row.name, row.school, row);
    return {row: annotation.index + 1, expectedRoleId: annotation.expectedRoleId,
      actualRoleId: match.roleId || '', auto: match.auto,
      status: result.error ? 'unavailable' : !match.auto ? 'manual' : match.roleId === annotation.expectedRoleId ? 'correctAuto' : 'wrongAuto'};
  });
}
function summarize(cases) {
  const fields = {};
  for (const item of cases) for (const entry of item.comparisons) {
    const field = fields[entry.field] ??= {total: 0, correct: 0, blank: 0, wrong: 0, unavailable: 0};
    field.total++; field[entry.status]++;
  }
  return fields;
}
function matchSummary(cases) {
  const summary = {evaluated: 0, correctAuto: 0, wrongAuto: 0, manual: 0, unavailable: 0};
  for (const match of cases.flatMap(c => c.matches)) { summary.evaluated++; summary[match.status]++; }
  summary.status = summary.evaluated ? 'evaluated' : 'not-evaluated';
  return summary;
}
const signature = report => JSON.stringify(report.cases.map(c => ({image: c.image, sha256: c.sha256, variant: c.variant,
  expectedRowCount: c.expectedRowCount, labels: c.comparisons.map(x => [x.row, x.field, x.expected]),
  matchLabels: (c.matches || []).map(x => [x.row, x.expectedRoleId])})));
function compareBaseline(report, baseline) {
  if (report.annotationHash !== baseline.annotationHash || signature(report) !== signature(baseline)) throw Error('Baseline inputs or annotations differ; comparison is invalid');
  const delta = {};
  for (const [field, current] of Object.entries(report.summary)) {
    const previous = baseline.summary[field];
    delta[field] = Object.fromEntries(['correct', 'blank', 'wrong', 'unavailable'].map(key => [key, current[key] - previous[key]]));
  }
  // A gain elsewhere cannot hide a new error in a previously correct cell or role.
  const regressions = [];
  report.cases.forEach((current, i) => {
    current.comparisons.forEach((entry, j) => {
      if (baseline.cases[i].comparisons[j].status === 'correct' && entry.status !== 'correct') regressions.push({image: current.image, variant: current.variant, row: entry.row, field: entry.field});
    });
    (current.matches || []).forEach((entry, j) => {
      if (entry.status === 'wrongAuto' && baseline.cases[i].matches[j].status !== 'wrongAuto') regressions.push({image: current.image, variant: current.variant, row: entry.row, field: 'roleId'});
    });
  });
  return {sourceRevision: baseline.sourceRevision, summary: baseline.summary, delta, regressions};
}
async function main(argv = process.argv.slice(2)) {
  const [input, output, reference] = argv;
  if (!input || !output || argv.length > 3) throw Error('Usage: node scripts/screenshot-private-qa.cjs <annotations.json> <new-report.json> [baseline-report.json]');
  const inputPath = privatePath(input), reportPath = privatePath(output), referencePath = reference && privatePath(reference);
  if ([inputPath, referencePath].includes(reportPath) || (referencePath && inputPath === referencePath)) throw Error('Input, output and baseline paths must be distinct');
  if (fs.existsSync(reportPath)) throw Error('Output already exists; choose a new report path');
  const labels = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  validateAnnotations(labels);
  const selected = selectVariants(process.env.JX3_OCR_VARIANTS);
  const baseline = referencePath ? JSON.parse(fs.readFileSync(referencePath, 'utf8')) : null;
  const images = labels.images.map(image => {
    const source = privatePath(path.resolve(root, image.file));
    const bytes = fs.readFileSync(source), sha256 = hash(bytes);
    if (image.sha256 && image.sha256 !== sha256) throw Error('Image hash changed: ' + image.id);
    return {...image, source, bytes, sha256};
  });
  let revision;
  try { revision = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(); } catch { revision = 'unavailable'; }
  const report = {schema: 2, status: 'running', createdAt: new Date().toISOString(), sourceRevision: revision,
    sourceHash: hash(fs.readFileSync(path.join(root, 'screenshot.js'))), runnerHash: hash(fs.readFileSync(__filename)),
    annotationHash: hash(JSON.stringify(labels)), cases: []};
  // Check the complete comparison plan before starting expensive OCR or writing anything.
  if (baseline) {
    const planned = {...report, cases: images.flatMap(image => selected.map(variant => ({image: image.id, sha256: image.sha256, variant: variant.id,
      expectedRowCount: image.expectedRowCount ?? null, comparisons: compareFields(image, {rows: []}), matches: compareMatches(image, {rows: []}, labels.roles || [])})))};
    if (baseline.status && baseline.status !== 'complete') throw Error('Baseline is incomplete');
    if (planned.annotationHash !== baseline.annotationHash || signature(planned) !== signature(baseline)) throw Error('Baseline inputs or annotations differ; comparison is invalid');
  }
  const {chromium} = require('playwright');
  const browser = await chromium.launch({headless: true, executablePath: process.env.JX3_BROWSER_PATH});
  const write = () => {
    report.summary = summarize(report.cases);
    report.matchSummary = matchSummary(report.cases);
    report.byVariant = Object.fromEntries(selected.map(v => [v.id, summarize(report.cases.filter(c => c.variant === v.id))]));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  };
  fs.mkdirSync(path.dirname(reportPath), {recursive: true});
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), {flag: 'wx'});
  try {
    const context = await browser.newContext({serviceWorkers: 'block'});
    await context.route('**/*', route => {
      const u = new URL(route.request().url());
      return u.protocol === 'http:' && u.hostname === '127.0.0.1' && u.port === '4173' ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/', {waitUntil: 'load', timeout: 30000});
    const served = await context.request.get('http://127.0.0.1:4173/screenshot.js');
    if (!served.ok() || hash(await served.body()) !== report.sourceHash) throw Error('Served OCR source differs from the workspace');
    report.browserVersion = browser.version();
    report.ocrAssets = Object.fromEntries(['tesseract.min.js', 'worker.min.js', 'chi_sim.traineddata.gz'].map(name => [name, hash(fs.readFileSync(path.join(root, 'vendor/ocr', name)))]));
    await page.evaluate(() => {
      const el = document.createElement('input'); el.type = 'file'; el.id = 'private-ocr-file'; document.body.append(el);
    });
    await page.evaluate(async () => {
      window.qaWorker = await WorkbenchScreenshot.createWorker(() => {});
    });
    for (const image of images) for (const variant of selected) {
      await page.locator('#private-ocr-file').setInputFiles({name: path.basename(image.source), mimeType: /\.png$/i.test(image.source) ? 'image/png' : 'image/jpeg', buffer: image.bytes});
      const started = Date.now();
      const result = await page.evaluate(async ({variant, top, bottom}) => {
        let timer;
        try {
          const original = document.querySelector('#private-ocr-file').files[0];
          // Preserve original uploaded bytes for the control case.
          let file = original;
          if (variant.id !== 'original') {
            const bitmap = await createImageBitmap(original), c = document.createElement('canvas');
            c.width = Math.round(bitmap.width * variant.scale); c.height = Math.round(bitmap.height * variant.scale);
            c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height); bitmap.close();
            const blob = await new Promise(resolve => c.toBlob(resolve, variant.quality ? 'image/jpeg' : 'image/png', variant.quality));
            file = new File([blob], variant.quality ? 'copy.jpg' : 'copy.png', {type: blob.type});
          }
          const rows = await Promise.race([
            WorkbenchScreenshot.recognize(file, {worker: window.qaWorker, roles: [], top, bottom}),
            new Promise((_, reject) => {timer = setTimeout(() => reject(Error('OCR case timed out')), 180000);})
          ]);
          return {rows};
        } catch (error) {return {rows: [], error: String(error.message || error)};}
        finally {clearTimeout(timer);}
      }, {variant, top: image.top ?? 23, bottom: image.bottom ?? 92});
      const item = {image: image.id, sha256: image.sha256, variant: variant.id,
        expectedRowCount: image.expectedRowCount ?? null, actualRowCount: result.rows.length,
        elapsedMs: Date.now() - started, error: result.error || null,
        comparisons: compareFields(image, result), matches: compareMatches(image, result, labels.roles || []), recognizedRows: result.rows};
      report.cases.push(item); write();
      console.log(JSON.stringify({image: image.id, variant: variant.id, rows: item.actualRowCount, error: item.error, counts: summarize([item])}));
      if (item.error === 'OCR case timed out') throw Error(item.error);
    }
    await page.evaluate(() => window.qaWorker.terminate());
    await context.close();
    if (baseline) report.baseline = compareBaseline(report, baseline);
    report.status = 'complete'; report.completedAt = new Date().toISOString(); write();
  } catch (error) {
    report.status = 'failed'; report.error = String(error.message || error); write(); throw error;
  } finally {await browser.close();}
  const failures = report.cases.filter(c => c.error || (c.expectedRowCount != null && c.actualRowCount !== c.expectedRowCount) || c.comparisons.some(x => x.status !== 'correct') || c.matches.some(x => x.status === 'wrongAuto'));
  if (failures.length) {console.error('Evaluation found differences in ' + failures.length + ' cases; inspect the local report.'); return 1;}
  return 0;
}
module.exports = {selectVariants, validateAnnotations, privatePath, compareFields, compareMatches, summarize, matchSummary, compareBaseline, main};
if (require.main === module) main().then(code => {process.exitCode = code;}).catch(error => {console.error(error.message); process.exitCode = 2;});
