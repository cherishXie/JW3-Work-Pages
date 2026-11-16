'use strict';
const assert = require('node:assert/strict'), S = require('../screenshot');
const roles = [
  {id: 'a', name: '测试灵@甲服', school: '万灵'},
  {id: 'b', name: '测试霜@甲服', school: '万灵'},
  {id: 'c', name: '测试灵@乙服', school: '七秀'}
];
for (const candidates of [roles, [...roles].reverse()]) {
  assert.equal(S.suggestRoles(candidates, '测试零', '万灵').auto, false, 'ambiguous one-character errors require review');
  assert.equal(S.suggestRoles(candidates, '测试灵@甲服', '万灵').roleId, 'a');
  assert.equal(S.suggestRoles(candidates, '测试灵@乙服', '七秀').roleId, 'c');
  assert.equal(S.suggestRoles(candidates, '测试零', '').auto, false, 'missing school cannot support a fuzzy identity');
}
assert.equal(S.suggestRoles([
  {id: 'a', name: '测试灵@甲服', school: '万灵'}, {id: 'c', name: '测试灵@乙服', school: '万灵'}
], '测试灵', '万灵').auto, false, 'same name and school with missing server requires review');
assert.equal(S.suggestRoles(roles, '完全陌生角色', '万灵').auto, false);
assert.equal(S.suggestRoles([{id: 'planned', name: '测试灵', school: '万灵', creationStatus: 'planned'}], '测试灵', '万灵').auto, false);
assert.equal(S.suggestRoles([{id: 'a', name: '测试灵@甲服', school: '万灵'}, {id: 'z', name: '陌生甲@乙服', school: '万灵'}], '测试灵@乙服', '万灵').auto, false, 'known conflicting server cannot be ignored');
const short = [{id: 'short', name: '测试', school: '藏剑', observedGold: 12345.6789}];
assert.equal(S.suggestRoles(short, '测式', '藏剑').auto, false, 'short fuzzy name alone is insufficient');
assert.equal(S.suggestRoles(short, '测式', '藏剑', {gold: '12345.6789'}).roleId, 'short');
assert.equal(S.suggestRoles(short, '测式', '藏剑', {gold: '12345'}).auto, false, 'rounded balance is not independent evidence');
assert.equal(S.suggestRoles(roles, '测试零', '万灵', {achievement: '0', petCount: '0'}).auto, false, 'zero values cannot resolve ambiguous names');
const collision = S.mergeScreenshots([{name: 'synthetic.png', rows: [
  {name: '测试灵', school: '万灵'}, {name: '测试零', school: '万灵'}
]}], {roles: [{id: 'a', name: '测试灵', school: '万灵'}]});
assert.equal(collision.rows.length, 2, 'distinct screenshot rows must survive a fuzzy match collision');
assert.ok(collision.rows.some(row => row.requiresManualMatch));
console.log('PASS similar names: candidate order, ambiguous glyphs, schools, short names, planned/unknown roles, suffixes, evidence, and row collisions');
