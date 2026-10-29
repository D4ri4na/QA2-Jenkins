const fs = require('node:fs');
const path = require('node:path');
const { required } = require('../config/browserstack.cjs');

async function main() {
    const username = required('BROWSERSTACK_USERNAME');
    const key = required('BROWSERSTACK_ACCESS_KEY');
    const appPath = process.argv[2] || process.env.BROWSERSTACK_APP_PATH;
    if (!appPath || !fs.existsSync(appPath)) throw new Error('Indica un archivo APK/AAB/XAPK de la app Reloj: npm run upload:app -- ruta/al/reloj.xapk');
    if (!/\.(apk|aab|xapk)$/i.test(appPath)) throw new Error('Formato de aplicacion Android no admitido.');
    const form = new FormData();
    form.append('file', await fs.openAsBlob(appPath), path.basename(appPath));
    form.append('custom_id', 'QA2Reloj');
    const response = await fetch('https://api-cloud.browserstack.com/app-automate/upload', {
        method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${username}:${key}`).toString('base64')}` },
        body: form, signal: AbortSignal.timeout(180000)
    });
    if (!response.ok) throw new Error(`BrowserStack rechazo la carga (HTTP ${response.status}). Comprueba credenciales, plan y archivo de la app.`);
    const result = await response.json();
    if (!/^bs:\/\/[a-zA-Z0-9_-]+$/.test(result.app_url || '')) throw new Error('BrowserStack no devolvio un app_url valido.');
    fs.writeFileSync(path.resolve(__dirname, '../appium/.browserstack-app.json'), JSON.stringify({ app_url: result.app_url }, null, 2));
    console.log('App cargada. Su identificador se guardo en appium/.browserstack-app.json (excluido de Git).');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
