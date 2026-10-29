const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { main, uploadError } = require('./upload-browserstack.cjs');

test('upload diagnostics redact credentials and preserve provider error', () => {
    const message = uploadError(422, { error: 'INVALID_APP', message: 'secret-user secret-key encoded-auth' }, ['secret-user', 'secret-key', 'encoded-auth']);
    assert.match(message, /HTTP 422.*INVALID_APP/);
    for (const secret of ['secret-user', 'secret-key', 'encoded-auth']) assert.ok(!message.includes(secret));
});

test('upload persists app_url or sanitized error; rejects invalid app ID', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa2-upload-'));
    const oldFetch = global.fetch;
    const oldUser = process.env.BROWSERSTACK_USERNAME;
    const oldKey = process.env.BROWSERSTACK_ACCESS_KEY;
    process.env.BROWSERSTACK_USERNAME = 'fixture-user';
    process.env.BROWSERSTACK_ACCESS_KEY = 'fixture-key';
    const appPath = path.join(dir, 'clock.xapk');
    const output = path.join(dir, 'app.json');
    const reports = path.join(dir, 'reports');
    fs.writeFileSync(appPath, 'fixture');
    try {
        global.fetch = async (url, options) => {
            assert.equal(url, 'https://api-cloud.browserstack.com/app-automate/upload');
            assert.equal(options.body.get('file').name, 'clock.xapk');
            return new Response(JSON.stringify({ error: 'INVALID_APP', message: 'fixture-key' }), { status: 422 });
        };
        await assert.rejects(main({ appPath, output, reports }), /HTTP 422.*INVALID_APP/);
        assert.ok(!fs.readFileSync(path.join(reports, 'browserstack-upload-error.json'), 'utf8').includes('fixture-key'));
        assert.ok(!fs.existsSync(output));
        global.fetch = async () => new Response(JSON.stringify({ app_url: 'bs://verified-app' }));
        await main({ appPath, output, reports });
        assert.equal(JSON.parse(fs.readFileSync(output)).app_url, 'bs://verified-app');
        await assert.rejects(main({ appPath: '', appId: 'invalid', output, reports }), /APP_ID/);
    } finally {
        global.fetch = oldFetch;
        for (const [name, value] of [['BROWSERSTACK_USERNAME', oldUser], ['BROWSERSTACK_ACCESS_KEY', oldKey]]) {
            if (value === undefined) delete process.env[name]; else process.env[name] = value;
        }
        fs.rmSync(dir, { recursive: true, force: true });
    }
});