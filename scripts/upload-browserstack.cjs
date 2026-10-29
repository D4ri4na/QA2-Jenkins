const fs = require('node:fs');
const path = require('node:path');
const { required } = require('../config/browserstack.cjs');

function uploadError(status, body, secrets = []) {
    let detail = typeof body === 'string' ? body : JSON.stringify(body);
    for (const secret of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) {
        detail = detail.split(secret).join('[REDACTED]');
    }
    return `BrowserStack rechazo la carga (HTTP ${status}): ${detail.slice(0, 2000)}`;
}

async function uploadWithRetry(url, options, { fetchImpl = fetch, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(180000) });
            if (![429, 502, 503, 504].includes(response.status) || attempt === 3) return response;
            await response.body?.cancel();
        } catch (error) {
            if (attempt === 3) throw error;
        }
        console.log(`Conexion temporalmente no disponible. Reintentando carga (${attempt + 1}/3)...`);
        await sleep(attempt * 5000);
    }
}
async function main({
    output = path.resolve(__dirname, '../appium/.browserstack-app.json'),
    appPath = process.argv[2] || process.env.BROWSERSTACK_APP_PATH,
    appId = process.env.BROWSERSTACK_APP_ID,
    reports = path.resolve(__dirname, '../appium/reports')
} = {}) {
    if (!appPath && appId) {
        if (!/^bs:\/\/[a-zA-Z0-9_-]+$/.test(appId)) throw new Error('APP_ID debe ser un identificador bs:// valido.');
        fs.writeFileSync(output, JSON.stringify({ app_url: appId }, null, 2));
        return;
    }
    const username = required('BROWSERSTACK_USERNAME');
    const key = required('BROWSERSTACK_ACCESS_KEY');
    if (!appPath || !fs.existsSync(appPath)) throw new Error('Indica un archivo APK/AAB/XAPK de Reloj en APP_PATH.');
    if (!/\.(apk|aab|xapk)$/i.test(appPath)) throw new Error('Formato de aplicacion Android no admitido.');
    const form = new FormData();
    form.append('file', await fs.openAsBlob(appPath), path.basename(appPath));
    form.append('custom_id', 'QA2Reloj');
    const encoded = Buffer.from(`${username}:${key}`).toString('base64');
    let response;
    try {
        response = await uploadWithRetry('https://api-cloud.browserstack.com/app-automate/upload', {
            method: 'POST', headers: { Authorization: `Basic ${encoded}` }, body: form
        });
    } catch (error) {
        const code = error.cause?.code || error.code || error.name;
        const message = uploadError('sin respuesta', `${code}: ${error.cause?.message || error.message}`, [username, key, encoded]);
        fs.mkdirSync(reports, { recursive: true });
        fs.writeFileSync(path.join(reports, 'browserstack-upload-error.json'), JSON.stringify({ message }, null, 2));
        throw new Error(message);
    }
    if (!response.ok) {
        const raw = await response.text();
        let body;
        try {
            const data = JSON.parse(raw);
            body = { error: data.error, code: data.code, message: data.message };
        } catch { body = 'Respuesta no JSON. Revisar archivo y compatibilidad en App Automate.'; }
        const message = uploadError(response.status, body, [username, key, encoded]);
        fs.mkdirSync(reports, { recursive: true });
        fs.writeFileSync(path.join(reports, 'browserstack-upload-error.json'), JSON.stringify({ message }, null, 2));
        throw new Error(message);
    }
    const result = await response.json();
    if (!/^bs:\/\/[a-zA-Z0-9_-]+$/.test(result.app_url || '')) throw new Error('BrowserStack no devolvio un app_url valido.');
    fs.writeFileSync(output, JSON.stringify({ app_url: result.app_url }, null, 2));
    console.log('Reloj cargado en BrowserStack. Identificador guardado para las pruebas moviles.');
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { uploadError, uploadWithRetry, main };