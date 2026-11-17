const test = require('node:test');
const assert = require('node:assert/strict');
const { getCurrentPackage } = require('../appium/support/android-compat.cjs');
const { clock } = require('../appium/pageObjects/clockPage');
const pkg = 'com.google.android.deskclock';
const unsupported = () => new Error('unknown command: WebDriverError: Unknown mobile command "getCurrentPackage". Only shell,startActivity commands are supported.');

test('Un servidor moderno devuelve el paquete sin usar el endpoint antiguo', async () => {
    assert.equal(await getCurrentPackage({
        getCurrentPackage: async () => pkg,
        appiumGetCurrentPackage: async () => assert.fail('No debe usar el endpoint antiguo')
    }), pkg);
});

test('La respuesta de BrowserStack usa el endpoint current_package de Appium', async () => {
    let calls = 0;
    assert.equal(await getCurrentPackage({
        getCurrentPackage: async () => { throw unsupported(); },
        appiumGetCurrentPackage: async () => { calls++; return pkg; }
    }), pkg);
    assert.equal(calls, 1);
});

for (const message of ['Request timed out', 'invalid session id', 'Unknown mobile command "startActivity"']) {
    test(`No se oculta otro fallo: ${message}`, async () => {
        const error = new Error(message);
        await assert.rejects(getCurrentPackage({
            getCurrentPackage: async () => { throw error; },
            appiumGetCurrentPackage: async () => assert.fail('No debe reintentar otros fallos')
        }), thrown => thrown === error);
    });
}

test('Un fallo del endpoint antiguo mantiene la prueba fallida', async () => {
    const error = new Error('Servidor Appium desconectado');
    await assert.rejects(getCurrentPackage({
        getCurrentPackage: async () => { throw unsupported(); },
        appiumGetCurrentPackage: async () => { throw error; }
    }), thrown => thrown === error);
});

for (const current of [pkg, 'com.android.launcher3']) {
    test(`La navegacion continua tras el error de BrowserStack desde ${current}`, async t => {
        const globals = ['driver', 'browser', '$', 'expect'];
        const previous = globals.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
        t.after(() => globals.forEach((name, index) => {
            if (previous[index]) Object.defineProperty(globalThis, name, previous[index]);
            else delete globalThis[name];
        }));
        const activations = [];
        let selected = false;
        let checked = false;
        globalThis.driver = {
            getCurrentPackage: async () => { throw unsupported(); },
            appiumGetCurrentPackage: async () => current,
            activateApp: async name => activations.push(name),
            isKeyboardShown: async () => false
        };
        globalThis.browser = { waitUntil: async predicate => assert.equal(await predicate(), true) };
        globalThis.$ = async selector => ({
            isDisplayed: async () => selector.endsWith('tab_menu_alarm'),
            click: async () => { selected = true; }
        });
        globalThis.expect = element => ({ toHaveAttribute: async (name, value) => {
            assert.equal(name, 'selected');
            assert.equal(value, 'true');
            assert.equal(selected, true);
            checked = true;
        } });
        await clock.tab('alarm');
        assert.deepEqual(activations, current === pkg ? [] : [pkg]);
        assert.equal(checked, true);
    });
}
