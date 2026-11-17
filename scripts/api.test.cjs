const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const gate = path.resolve(__dirname, '../tools/quality-gate.js');

for (const scenario of ['aprobado', 'ausente', 'fallido', 'simulado']) {
  test(`Quality gate smoke: ${scenario}`, () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'qa2-api-'));
    try {
      fs.mkdirSync(path.join(cwd, 'reports'));
      if (scenario !== 'ausente') {
        const run = { stats: { requests: { total: 3, failed: 0 }, assertions: { total: 3, failed: scenario === 'fallido' ? 1 : 0 } },
          failures: scenario === 'fallido' ? [{}] : [],
          executions: Array.from({ length: 3 }, () => ({ item: { name: 'Smoke' }, request: { method: 'GET' }, response: { code: 200, responseTime: 10 }, assertions: [{}] })) };
        fs.writeFileSync(path.join(cwd, 'reports/raw-smoke.json'), JSON.stringify({ run }));
      }
      const result = spawnSync(process.execPath, [gate, '--modo', 'SOLO_SMOKE', '--simular', String(scenario === 'simulado')], { cwd, encoding: 'utf8' });
      assert.equal(result.status, scenario === 'aprobado' ? 0 : 1, result.stderr);
      const summary = JSON.parse(fs.readFileSync(path.join(cwd, 'reports/QA_Resumen.json'), 'utf8'));
      assert.equal(summary.qualityGate, scenario === 'aprobado' ? 'APROBADO' : 'RECHAZADO');
      assert.equal(fs.existsSync(path.join(cwd, 'reports/raw-smoke.json')), false);
    } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
  });
}
