const fs = require('node:fs');
const path = require('node:path');

function required(name) {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Falta ${name}. Consulta README.md; configura las credenciales fuera de Git.`);
    return value;
}

function connection() {
    return {
        user: required('BROWSERSTACK_USERNAME'),
        key: required('BROWSERSTACK_ACCESS_KEY'),
        protocol: 'https', hostname: 'hub-cloud.browserstack.com', port: 443, path: '/wd/hub'
    };
}

function options(sessionName) {
    return {
        projectName: 'QA2 - Practico 4 Bloque 2',
        buildName: process.env.BROWSERSTACK_BUILD_NAME || `QA2-${process.env.BUILD_NUMBER || new Date().toISOString().slice(0, 10)}`,
        sessionName, debug: true, video: true,
        ...(process.env.BROWSERSTACK_APPIUM_VERSION ? { appiumVersion: process.env.BROWSERSTACK_APPIUM_VERSION } : {})
    };
}

function app() {
    const uploaded = path.resolve(__dirname, '../appium/.browserstack-app.json');
    const value = process.env.BROWSERSTACK_APP_ID || (fs.existsSync(uploaded) && JSON.parse(fs.readFileSync(uploaded, 'utf8')).app_url);
    if (!value || !/^bs:\/\/[a-zA-Z0-9_-]+$/.test(value)) {
        throw new Error('Falta BROWSERSTACK_APP_ID (bs://...) de la app Reloj. Ejecuta npm run upload:app -- ruta/al/reloj.xapk o configura el parametro APP_ID de Jenkins.');
    }
    return value;
}

async function markSession(result) {
    await browser.execute(`browserstack_executor: ${JSON.stringify({ action: 'setSessionStatus', arguments: {
        status: result === 0 ? 'passed' : 'failed', reason: result === 0 ? 'Todas las pruebas aprobadas' : 'Pruebas o hooks fallidos; consultar reporte Jenkins'
    } })}`);
}

module.exports = { required, connection, options, app, markSession };
