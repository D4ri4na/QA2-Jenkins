const fs = require('node:fs');
const path = require('node:path');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function createReporter(output, title) {
    const file = path.join(output, 'results.json');
    return {
        prepare() {
            fs.rmSync(output, { recursive: true, force: true });
            fs.mkdirSync(path.join(output, 'screenshots'), { recursive: true });
            fs.writeFileSync(file, '[]');
        },
        record(result) {
            const results = JSON.parse(fs.readFileSync(file, 'utf8'));
            results.push(result);
            fs.writeFileSync(file, JSON.stringify(results, null, 2));
        },
        finish(exitCode) {
            const results = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
            const passed = results.filter(test => test.passed).length;
            const successful = exitCode === 0 && results.length > 0 && passed === results.length;
            const rows = results.map(test => `<tr><td>${escape(test.suite)}</td><td>${escape(test.name)}</td><td>${test.passed ? 'Aprobada' : 'Fallida'}</td><td>${escape(test.duration)} ms</td><td>${escape(test.error)}</td></tr>`).join('');
            fs.mkdirSync(output, { recursive: true });
            fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><title>${escape(title)}</title><style>body{font:16px system-ui;margin:40px;color:#172b4d}table{border-collapse:collapse;width:100%}td,th{padding:12px;text-align:left;border-bottom:1px solid #ddd}h1{color:#155e75}</style><h1>${escape(title)}</h1><p>Resultado: ${successful ? 'CORRECTO' : 'FALLIDO'} · Pruebas: ${results.length} · Aprobadas: ${passed} · Fallidas: ${results.length-passed}</p><table><tr><th>Suite</th><th>Prueba</th><th>Estado</th><th>Duración</th><th>Error</th></tr>${rows}</table></html>`);
            if (!results.length && exitCode === 0) throw new Error('La ejecucion termino sin pruebas: no se considera aprobada.');
        }
    };
}
module.exports = { createReporter, ...createReporter(path.resolve(__dirname, '../reports'), 'Practico 4 - WebdriverIO') };