const { clock, id } = require('../pageObjects/clockPage');

describe('Practico 7 - App de Tiempo', () => {
    before(async () => { await clock.prepare(); });
    after(async () => { await clock.deleteAlarm(); });

    it('Desactivar una alarma activa creada por la prueba', async () => {
        await clock.ensureAlarm();
        const toggle = await clock.alarm().$(id('onoff'));
        if (await toggle.getAttribute('checked') !== 'true') await toggle.click();
        await expect(toggle).toHaveAttribute('checked', 'true');
        await toggle.click();
        await expect(toggle).toHaveAttribute('checked', 'false');
    });

    it('Crear una nueva alarma en horario PM', async () => {
        await clock.deleteAlarm();
        await clock.createAlarm();
        await expect(clock.alarm()).toHaveAttribute('content-desc', expect.stringMatching(/PM|16:17/));
    });

    it('Expandir una alarma y anadirle una etiqueta', async () => {
        await clock.expandAlarm();
        await (await clock.first([id('label_setting'), id('edit_label')])).click();
        await (await clock.first([id('alarm_label_edit'), id('label_input_field'), 'android.widget.EditText'])).setValue('QA2-practico7');
        await (await clock.first(['id=android:id/button1', 'android=new UiSelector().text("OK")', id('save_button')])).click();
        await clock.saveAlarmDetails();
        await expect(clock.alarm().$('android=new UiSelector().text("QA2-practico7")')).toBeDisplayed();
    });

    it('Configurar repeticion de alarma lunes, miercoles y viernes', async () => {
        await clock.expandAlarm();
        for (const day of [1, 3, 5]) {
            const button = await clock.first([id(`day_button_${day}`)]);
            if (await button.getAttribute('checked') !== 'true') await button.click();
            await expect(button).toHaveAttribute('checked', 'true');
        }
        await clock.saveAlarmDetails();
    });

    it('Iniciar y pausar el cronometro', async () => {
        await clock.tab('stopwatch');
        const start = await clock.first([id('start_stop_button'), id('fab')]);
        const state = async () => {
            const description = await start.getAttribute('content-desc');
            return description && description !== 'null' ? description : await start.getText();
        };
        if (/Stop|Pause/i.test(await state())) await start.click();
        const reset = await $(id('reset_button'));
        if (await reset.isDisplayed() && await reset.isEnabled()) await reset.click();
        await start.click();
        try {
            await browser.waitUntil(async () => /Stop|Pause/i.test(await state()), { timeoutMsg: 'El cronometro no inicio' });
        } finally {
            if (/Stop|Pause/i.test(await state())) await start.click();
        }
        await browser.waitUntil(async () => /Start|Resume/i.test(await state()), { timeoutMsg: 'El cronometro no quedo pausado' });
        await (await clock.first([id('reset_button'), '~Reset'])).click();
        await expect($(id('stopwatch_time_text'))).toHaveText(expect.stringMatching(/^0[0:.]*$/));
    });
    it('Configurar un temporizador de un minuto sin dejarlo sonando', async () => {
        await clock.tab('timer');
        if (!await $(id('timer_setup_digit_1')).isDisplayed()) {
            await (await clock.first([id('add_timer_button')])).click();
        }
        const clear = await $(id('timer_setup_delete'));
        for (let digit = 0; digit < 6 && await clear.isEnabled(); digit++) await clear.click();
        await (await clock.first([id('timer_setup_digit_1')])).click();
        const zero = await clock.first([id('timer_setup_digit_0')]);
        await zero.click();
        await zero.click();
        await expect($(id('hour_text'))).toHaveText('00');
        await expect($(id('minute_text'))).toHaveText('01');
        await expect($(id('second_text'))).toHaveText('00');
        await (await clock.first([id('timer_start_button'), id('fab'), '~Start'])).click();
        try {
            const pause = await clock.first([id('play_pause_button'), id('fab'), '~Pause']);
            await pause.click();
            const resume = await clock.first([id('pause_resume_text'), id('play_pause_button'), '~Resume']);
            const description = await resume.getAttribute('content-desc');
            const state = description && description !== 'null' ? description : await resume.getText();
            expect(state).toMatch(/Resume|Start/i);
        } finally {
            await (await clock.first([id('delete_timer_button'), id('delete_button'), '~Delete'])).click();
        }
        await expect($(id('timer_setup_digit_1'))).toBeDisplayed();
    });
    it('Agregar La Paz al Reloj Mundial', async () => {
        await clock.tab('clock');
        const existing = await $('android=new UiSelector().textContains("La Paz")');
        if (await existing.isExisting()) {
            await expect(existing).toBeDisplayed();
            return;
        }
        await (await clock.first([id('fab')])).click();
        const search = await clock.first([id('open_search_view_edit_text'), id('search_src_text')]);
        await search.setValue('La Paz');
        await (await clock.first(['android=new UiSelector().resourceId("com.google.android.deskclock:id/city_name").textContains("La Paz")'])).click();
        await expect($(id('tab_menu_clock'))).toBeDisplayed();
        await expect($('android=new UiSelector().textContains("La Paz")')).toBeDisplayed();
    });
});
