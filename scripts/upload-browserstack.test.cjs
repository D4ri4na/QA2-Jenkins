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
test('transient connection failures retry; invalid app responses do not retry', async () => {
    const { uploadWithRetry } = require('./upload-browserstack.cjs');
    let calls = 0;
    const sleeps = [];
    const response = await uploadWithRetry('https://example.invalid', {}, {
        fetchImpl: async () => { calls++; if (calls < 3) throw new TypeError('fetch failed'); return new Response('{}'); },
        sleep: async ms => sleeps.push(ms)
    });
    assert.equal(response.status, 200);
    assert.equal(calls, 3);
    assert.deepEqual(sleeps, [5000, 10000]);
    calls = 0;
    await uploadWithRetry('https://example.invalid', {}, {
        fetchImpl: async () => { calls++; return new Response('{}', { status: 422 }); },
        sleep: async () => assert.fail('422 must not retry')
    });
    assert.equal(calls, 1);
    calls = 0;
    await assert.rejects(uploadWithRetry('https://example.invalid', {}, {
        fetchImpl: async () => { calls++; throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } }); },
        sleep: async () => {}
    }), error => error.cause.code === 'UND_ERR_CONNECT_TIMEOUT');
    assert.equal(calls, 3);
});