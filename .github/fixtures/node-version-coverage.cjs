// Synthetic artifacts for the workflow's upload/download contract, not project coverage.
const assert = require('node:assert/strict');
const fs = require('node:fs');

assert.match(process.version, /^v22\./);
const metric = { total: 0, covered: 0, skipped: 0, pct: 100 };
fs.mkdirSync('coverage', { recursive: true });
fs.writeFileSync('coverage/coverage-summary.json', JSON.stringify({
  total: { lines: metric, statements: metric, functions: metric, branches: metric },
}));
fs.writeFileSync('coverage/coverage-final.json', '{}');
