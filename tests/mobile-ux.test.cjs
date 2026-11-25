const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { if (name in imports) return imports[name]; throw Error(name); }, Date, Intl, URLSearchParams });
  return exports;
}
const utils = load('src/features/learning/utils.ts', { '../../lib/api/client': {} });
const p = load('src/features/learning/presentation.ts', { './utils': utils });
test('week strip spans Monday to Sunday across year boundaries', () => {
  assert.equal(p.weekDays('2027-01-01').join(','), '2026-12-28,2026-12-29,2026-12-30,2026-12-31,2027-01-01,2027-01-02,2027-01-03');
  assert.equal(p.weekDays('2026-11-15')[6], '2026-11-15');
});
test('calendar caption stays on the requested date, independent of device timezone', () => {
  assert.match(p.dateCaption('2027-01-01'), /1\/1/);
  assert.equal(p.dateCaption('not-a-date'), 'not-a-date');
});
test('weekly agenda sorts days and times without mutating API data or hiding cancellations', () => {
  const rows = [
    { sessionId: 4, date: '2026-11-16', startTime: '18:00', status: 'SCHEDULED' },
    { sessionId: 2, date: '2026-11-15', startTime: null, status: 'SCHEDULED' },
    { sessionId: 3, date: '2026-11-15', startTime: '15:00', status: 'CANCELLED' },
    { sessionId: 1, date: '2026-11-15', startTime: '09:00', status: 'COMPLETED' },
  ];
  const before = JSON.stringify(rows), groups = p.groupSessions(rows);
  assert.equal(groups.map(g => g.date).join(','), '2026-11-15,2026-11-16');
  assert.equal(groups[0].sessions.map(s => s.sessionId).join(','), '1,3,2');
  assert.equal(groups[0].sessions[1].status, 'CANCELLED');
  assert.equal(JSON.stringify(rows), before);
});
test('unverified, missing and malformed debt never becomes paid on home', () => {
  for (const summary of [
    { coverageComplete: false, outstanding: '0.00' },
    { coverageComplete: false, outstanding: '100.00' },
    { coverageComplete: true, outstanding: null },
    { coverageComplete: true, outstanding: '' },
    { coverageComplete: true, outstanding: 'NaN' },
    { coverageComplete: true, outstanding: '-1.00' },
  ]) assert.equal(p.homeFeeState(summary), 'review');
});
test('verified zero can be quiet; positive decimal balances stay actionable without numeric rounding', () => {
  assert.equal(p.homeFeeState({ coverageComplete: true, outstanding: '0.00' }), 'clear');
  for (const outstanding of ['0.01', '5000000.00', '9007199254740993.00']) {
    assert.equal(p.homeFeeState({ coverageComplete: true, outstanding }), 'due');
  }
});
