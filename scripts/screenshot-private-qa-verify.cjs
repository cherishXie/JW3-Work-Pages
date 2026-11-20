'use strict';
// Synthetic annotations only; no real screenshots or roles are needed by npm test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const Q = require('./screenshot-private-qa.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const labels = {images: [{id: 'fixture', file: 'output/test.png', expectedRowCount: 1,
  rows: [{index: 0, fields: {name: '测试灵', gold: '1.0000', level: '50'}}]}]};
assert.equal(Q.selectVariants().length, 4);
for (const filter of ['', 'typo', 'original,typo', 'original,original']) assert.throws(() => Q.selectVariants(filter));
assert.deepEqual(Q.selectVariants('original').map(v => v.id), ['original']);
Q.validateAnnotations(labels);
for (const mutate of [
  a => {a.images = [];}, a => {a.images[0].rows = [];},
  a => {a.images[0].rows[0].fields = {};}, a => {a.images[0].rows[0].fields = {typo: '123'};},
  a => {a.images[0].rows[0].fields = {level: '0'};}, a => {a.images[0].rows[0].fields = {gold: NaN};},
  a => {a.images[0].rows[0].index = 1;}, a => {a.images[0].rows.push(copy(a.images[0].rows[0]));},
  a => {a.images.push(copy(a.images[0]));}, a => {a.images[0].top = 95;},
  a => {a.images[0].rows[0].expectedRoleId = 'missing';}
]) {const invalid = copy(labels); mutate(invalid); assert.throws(() => Q.validateAnnotations(invalid));}
const image = labels.images[0];
const correct = Q.compareFields(image, {rows: [{name: '测试灵', gold: '1', level: '50'}]});
assert.ok(correct.every(v => v.status === 'correct'));
assert.ok(Q.compareFields(image, {rows: []}).every(v => v.status === 'blank'));
assert.ok(Q.compareFields(image, {rows: [], error: 'failed header'}).every(v => v.status === 'unavailable'));
assert.equal(Q.compareFields(image, {rows: [{name: '测试霜', gold: '', level: '5'}]})[0].status, 'wrong');
const roles = [{id: 'a', name: '测试灵', school: '万灵'}, {id: 'b', name: '测试霜', school: '万灵'}];
const matchImage = {...image, rows: [{...image.rows[0], expectedRoleId: 'a'}]};
const wrong = Q.compareMatches(matchImage, {rows: [{name: '测试霜', school: '万灵'}]}, roles);
assert.equal(wrong[0].status, 'wrongAuto', 'OCR changing a name to another existing name must be counted as an unsafe match');
assert.equal(Q.compareMatches(matchImage, {rows: [], error: 'failed header'}, roles)[0].status, 'unavailable');
assert.equal(Q.matchSummary([{matches: []}]).status, 'not-evaluated');
assert.equal(Q.matchSummary([{matches: wrong}]).wrongAuto, 1);
const baseline = {annotationHash: 'same', cases: [{image: 'fixture', sha256: 'same', variant: 'original', expectedRowCount: 1,
  comparisons: correct, matches: []}]};
baseline.summary = Q.summarize(baseline.cases);
assert.deepEqual(Q.compareBaseline(copy(baseline), baseline).regressions, []);
const changed = copy(baseline); changed.cases[0].comparisons[0].status = 'wrong'; changed.summary = Q.summarize(changed.cases);
assert.equal(Q.compareBaseline(changed, baseline).regressions.length, 1);
assert.equal(Q.compareBaseline(changed, baseline).delta.name.wrong, 1);
const mismatched = copy(baseline); mismatched.annotationHash = 'different';
assert.throws(() => Q.compareBaseline(mismatched, baseline));
assert.throws(() => Q.privatePath('/tmp/outside-private-data.json'));
const output = path.resolve(__dirname, '../output'); fs.mkdirSync(output, {recursive: true});
const dir = fs.mkdtempSync(path.join(output, 'synthetic-ocr-runner-'));
try {
  const input = path.join(dir, 'labels.json'), existing = path.join(dir, 'existing.json'), newReport = path.join(dir, 'new.json');
  fs.writeFileSync(input, JSON.stringify(labels)); fs.writeFileSync(existing, 'preserve');
  // Junctions avoid the Windows privilege requirement for directory symlinks.
  const outside = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'jw3-outside-'));
  try {
    fs.symlinkSync(outside, path.join(dir, 'outside'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => Q.privatePath(path.join(dir, 'outside', 'escape.json')));
  } finally { fs.rmSync(outside, {recursive: true, force: true}); }
  for (const args of [[input, input], [input, existing], [input, newReport, input]]) {
    const result = spawnSync(process.execPath, [path.join(__dirname, 'screenshot-private-qa.cjs'), ...args], {encoding: 'utf8', timeout: 5000});
    assert.equal(result.status, 2, result.stderr);
  }
  const zero = spawnSync(process.execPath, [path.join(__dirname, 'screenshot-private-qa.cjs'), input, newReport], {
    encoding: 'utf8', timeout: 5000, env: {...process.env, JX3_OCR_VARIANTS: 'typo'}});
  assert.equal(zero.status, 2, zero.stderr);
  assert.equal(fs.existsSync(newReport), false);
  assert.equal(fs.readFileSync(existing, 'utf8'), 'preserve');
  assert.deepEqual(JSON.parse(fs.readFileSync(input)), labels);
} finally {fs.rmSync(dir, {recursive: true, force: true});}
console.log('PASS OCR evaluator: reject zero cases, malformed labels, path overwrite and symlink escape; distinguish failures, untested matching, wrong role identity, and cell regressions');
