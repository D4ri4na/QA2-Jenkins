const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const newman = require('newman');
const root = path.resolve(__dirname, '..');
process.chdir(root);

async function main() {
  if (!process.env.GOREST_TOKEN) throw new Error('Falta GOREST_TOKEN (credencial Jenkins qa2-gorest-token).');
  const mode = process.env.MODO || 'COMPLETO';
  if (!['COMPLETO', 'SOLO_SMOKE'].includes(mode)) throw new Error('MODO debe ser COMPLETO o SOLO_SMOKE.');
  const preflight = spawnSync(process.execPath, ['tools/preflight.js'], { stdio: 'inherit' });
  if (preflight.status !== 0) throw new Error('Fallo el preflight de API.');
  const environment = JSON.parse(fs.readFileSync('PruebaQA1.postman_environment.json', 'utf8'));
  environment.values = environment.values.filter(value => value.key !== 'token');
  environment.values.push({ key: 'token', value: process.env.GOREST_TOKEN, enabled: true });
  const suites = [['smoke', 'QA_Smoke.postman_collection.json']];
  if (mode === 'COMPLETO') {
    suites.push(['regresion', 'PruebaQA1.postman_collection.json']);
    if (process.env.PRUEBAS_NEGATIVAS !== 'false') suites.push(['negativas', 'QA_Negativas.postman_collection.json']);
  }
  let failed = false;
  for (const [name, collection] of suites) {
    await new Promise(resolve => newman.run({
      collection, environment, delayRequest: 100, timeoutRequest: 30000, timeoutScript: 10000,
      reporters: ['cli', 'junit'], reporter: { junit: { export: `reports/${name}.xml` } }
    }, (error, summary) => {
      if (error || !summary) { console.error(`Newman no pudo completar ${name}.`); failed = true; resolve(); return; }
      const run = summary.run;
      // El dashboard solo necesita metricas: no guardar headers, tokens ni cuerpos.
      const safe = { stats: run.stats, failures: (run.failures || []).map(() => ({})), executions: (run.executions || []).map(ex => ({
        item: { name: ex.item.name }, request: { method: ex.request.method },
        response: ex.response ? { code: ex.response.code, responseTime: ex.response.responseTime } : undefined,
        requestError: !!ex.requestError, assertions: (ex.assertions || []).map(a => ({ error: !!a.error }))
      })) };
      fs.writeFileSync(`reports/raw-${name}.json`, JSON.stringify({ run: safe }));
      if (run.failures.length) failed = true;
      resolve();
    }));
  }
  const gate = spawnSync(process.execPath, ['tools/quality-gate.js', '--modo', mode,
    '--negativas', process.env.PRUEBAS_NEGATIVAS || 'true', '--promedio', process.env.MAX_PROMEDIO_MS || '3000',
    '--p95', process.env.MAX_P95_MS || '5000', '--simular', process.env.SIMULAR_FALLO || 'false'], { stdio: 'inherit' });
  process.exitCode = failed || gate.status !== 0 ? 1 : 0;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
