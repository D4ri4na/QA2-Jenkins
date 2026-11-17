const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { clock, id } = require('../appium/pageObjects/clockPage');

function ui(t, controls) {
    const names = ['$', 'browser', 'expect'];
    const previous = names.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
    t.after(() => names.forEach((name, index) => {
        if (previous[index]) Object.defineProperty(globalThis, name, previous[index]);
        else delete globalThis[name];
    }));
    globalThis.$ = selector => controls[selector] || { isDisplayed: async () => false };
    globalThis.browser = { waitUntil: async (predicate, options) => {
        if (!await predicate()) throw new Error(options.timeoutMsg);
    } };
    globalThis.expect = element => ({ toBeDisplayed: async () => assert.equal(await (await element).isDisplayed(), true) });
}

test('El temporizador de Reloj 7.5 pausa con play_pause y elimina con tertiary_button', async t => {
    const clicks = [];
    let state = 'Pause';
    let deleted = false;
    const action = { isDisplayed: async () => true, getAttribute: async () => state,
        click: async () => { clicks.push('pause'); state = 'Start'; } };
    ui(t, {
        [id('play_pause')]: action,
        [id('fab')]: { isDisplayed: async () => true, click: async () => assert.fail('fab agrega otro temporizador') },
        [id('tertiary_button')]: { isDisplayed: async () => true, click: async () => { clicks.push('delete'); deleted = true; } },
        [id('timer_setup_digit_1')]: { isDisplayed: async () => deleted }
    });
    await clock.pauseTimer();
    await clock.deleteTimer();
    assert.deepEqual(clicks, ['pause', 'delete']);
});

test('El temporizador moderno admite Pause por accesibilidad y Resume como texto', async t => {
    let paused = false;
    ui(t, {
        '~Pause': { isDisplayed: async () => !paused, click: async () => { paused = true; } },
        [id('pause_resume_text')]: { isDisplayed: async () => paused, getAttribute: async () => null, getText: async () => 'Resume' }
    });
    await clock.pauseTimer();
    assert.equal(paused, true);
});

test('Un temporizador que sigue corriendo no se declara pausado', async t => {
    ui(t, { [id('play_pause')]: { isDisplayed: async () => true, click: async () => {}, getAttribute: async () => 'Pause' } });
    await assert.rejects(clock.pauseTimer(), /no quedo pausado/);
});

test('Eliminar debe comprobar que reaparece la configuracion del temporizador', async t => {
    ui(t, {
        [id('tertiary_button')]: { isDisplayed: async () => true, click: async () => {} },
        [id('timer_setup_digit_1')]: { isDisplayed: async () => false }
    });
    await assert.rejects(clock.deleteTimer(), assert.AssertionError);
});

for (const sample of [
    { name: 'Reloj 7.5 sin descripcion en la tarjeta', text: '16:17', timeDescription: '16:17', cardDescription: null, pm: true },
    { name: 'Reloj moderno con descripcion en la tarjeta', text: '4:17', timeDescription: null, cardDescription: '4:17 PM alarm', pm: true },
    { name: 'Una alarma AM no satisface el caso PM', text: '04:17', timeDescription: '04:17 AM', cardDescription: null, pm: false }
]) {
    test(sample.name, async t => {
        ui(t, {});
        globalThis.$ = () => ({
            $: () => ({ getText: async () => sample.text, getAttribute: async () => sample.timeDescription }),
            getAttribute: async () => sample.cardDescription
        });
        assert.equal(/\bPM\b|16:17/i.test(await clock.alarmDescription()), sample.pm);
    });
}

test('El XPath encuentra ambas tarjetas y excluye las alarmas 14:17 y 09:00', { skip: process.platform !== 'win32' }, t => {
    ui(t, {});
    globalThis.$ = selector => ({ selector });
    const selector = clock.alarm().selector;
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        '$ErrorActionPreference="Stop"; [xml]$ui=Get-Content -LiteralPath $env:CLOCK_FIXTURE -Raw; $ui.SelectNodes($env:CLOCK_XPATH).Count'], {
        encoding: 'utf8', env: { ...process.env, CLOCK_FIXTURE: path.join(__dirname, 'fixtures/clock-alarms.xml'), CLOCK_XPATH: selector }
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), '2');
});
