const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cloud = require('../config/browserstack.cjs');
const { createReporter } = require('../webDriveIO/reporters/html-report.cjs');
const names = ['BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY', 'BROWSERSTACK_APP_ID'];
const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
test.after(() => { for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; } });

test('Las credenciales ausentes impiden conectar a BrowserStack', () => {
    delete process.env.BROWSERSTACK_USERNAME;
    delete process.env.BROWSERSTACK_ACCESS_KEY;
    assert.throws(() => cloud.connection(), /BROWSERSTACK_USERNAME/);
    process.env.BROWSERSTACK_USERNAME = 'test-user';
    assert.throws(() => cloud.connection(), /BROWSERSTACK_ACCESS_KEY/);
});
test('La configuracion movil usa HTTPS remoto, la app subida y ningun emulador local', () => {
    process.env.BROWSERSTACK_USERNAME = 'test-user';
    process.env.BROWSERSTACK_ACCESS_KEY = 'test-key';
    process.env.BROWSERSTACK_APP_ID = 'bs://configuration-test';
    const { config } = require('../appium/wdio.browserstack.conf');
    assert.equal(config.port, 443);
    assert.equal(config.protocol, 'https');
    assert.equal(config.hostname, 'hub-cloud.browserstack.com');
    assert.equal(config.capabilities[0]['appium:app'], 'bs://configuration-test');
    assert.equal(config.capabilities[0]['appium:udid'], undefined);
    assert.equal(config.services, undefined);
    assert.equal(config.specs.length, 1);
    assert.ok(fs.readdirSync(path.resolve(__dirname, '../appium/test')).some(file => file.endsWith('.js')));
});
test('Un identificador de app incorrecto se rechaza antes de crear sesiones', () => {
    process.env.BROWSERSTACK_APP_ID = 'C:/apps/reloj.apk';
    assert.throws(() => cloud.app(), /BROWSERSTACK_APP_ID/);
});
test('La configuracion web remota conserva la suite y usa capacidades de escritorio', () => {
    const { config } = require('../webDriveIO/wdio.browserstack.conf');
    assert.equal(config.capabilities[0].browserName, 'chrome');
    assert.equal(config.capabilities[0]['goog:chromeOptions'], undefined);
    assert.equal(config.capabilities[0]['bstack:options'].os, 'Windows');
    assert.equal(config.capabilities[0]['wdio:enforceWebDriverClassic'], true);
});
test('Los reportes no declaran aprobada una ejecucion vacia ni un hook fallido', () => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'qa2-report-'));
    try {
        const report = createReporter(output, 'QA2 <prueba>');
        report.prepare();
        assert.throws(() => report.finish(0), /sin pruebas/);
        report.record({ suite: 'Reloj', name: '<script>error</script>', passed: true, duration: 1 });
        report.finish(1);
        const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
        assert.match(html, /FALLIDO/);
        assert.match(html, /&lt;script&gt;/);
        assert.doesNotMatch(html, /<script>error/);
        report.prepare();
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(output, 'results.json'), 'utf8')), []);
    } finally { fs.rmSync(output, { recursive: true, force: true }); }
});
