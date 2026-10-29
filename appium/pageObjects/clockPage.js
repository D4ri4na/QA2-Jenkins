const pkg = 'com.google.android.deskclock';
const id = name => `id=${pkg}:id/${name}`;
class ClockPage {
    async first(selectors, timeout = 15000) {
        let found;
        await browser.waitUntil(async () => {
            for (const selector of selectors) {
                const element = await $(selector);
                if (await element.isDisplayed()) { found = element; return true; }
            }
            return false;
        }, { timeout, timeoutMsg: `No se encontro el control de Reloj: ${selectors.join(', ')}` });
        return found;
    }
    async prepare() {
        // Los contadores animados nunca quedan inactivos; usamos esperas explicitas por control.
        await driver.updateSettings({ waitForIdleTimeout: 0, waitForSelectorTimeout: 0 });
        const systemError = await $('id=android:id/aerr_wait');
        if (await systemError.isExisting()) throw new Error('Android no responde (ANR). Reinicia el emulador; esta ejecucion no es valida.');
        for (let i = 0; i < 3; i++) {
            const tip = await $('android=new UiSelector().textMatches("Got it|Entendido")');
            if (!await tip.isExisting()) break;
            await tip.click();
        }
        await this.tab('alarm');
    }
    async saveAlarmDetails() {
        const save = await $(id('save_button'));
        if (await save.isDisplayed()) {
            await save.click();
            await expect(save).not.toBeDisplayed();
        }
    }
    async tab(name) {
        if (await driver.getCurrentPackage() !== pkg) await driver.activateApp(pkg);
        if (await driver.isKeyboardShown()) await driver.hideKeyboard();
        const pickerCancel = await $(id('material_timepicker_cancel_button'));
        if (await pickerCancel.isDisplayed()) await pickerCancel.click();
        await this.saveAlarmDetails();
        const tab = await this.first([id(`tab_menu_${name}`)]);
        await tab.click();
        await expect(tab).toHaveAttribute('selected', 'true');
    }
    alarm() {
        return $(`//*[@resource-id="${pkg}:id/alarm_card"][.//*[@resource-id="${pkg}:id/digital_clock" and (contains(@text,"4:17") or contains(@text,"16:17"))]]`);
    }
    async createAlarm() {
        await this.tab('alarm');
        await (await this.first([id('fab'), '~Add alarm'])).click();
        const mode = await $(id('material_timepicker_mode_button'));
        if (await mode.isExisting() && /text input|texto/i.test(await mode.getAttribute('content-desc'))) await mode.click();
        const hour = await this.first(['android=new UiSelector().className("android.widget.EditText").instance(0)']);
        const hasPeriod = await $(id('material_clock_period_pm_button')).isExisting();
        await hour.setValue(hasPeriod ? '4' : '16');
        await (await this.first([id('material_minute_text_input')])).click();
        const minute = await this.first(['android.widget.EditText']);
        await minute.setValue('17');
        if (await driver.isKeyboardShown()) await driver.hideKeyboard();
        if (hasPeriod) await (await this.first([id('material_clock_period_pm_button')])).click();
        await (await this.first([id('material_timepicker_ok_button'), 'id=android:id/button1'])).click();
        await expect(this.alarm()).toBeDisplayed();
    }
    async ensureAlarm() {
        await this.tab('alarm');
        if (!await this.alarm().isExisting()) await this.createAlarm();
    }
    async expandAlarm() {
        await this.ensureAlarm();
        const label = await this.alarm().$(id('label_setting'));
        if (!await label.isDisplayed()) await this.alarm().$(id('clock_switch_flow')).click();
    }
    async deleteAlarm() {
        await this.tab('alarm');
        if (!await this.alarm().isExisting()) return;
        await this.expandAlarm();
        await (await this.first([id('delete_button'), id('delete')])).click();
        await expect(this.alarm()).not.toBeExisting();
    }
}
module.exports = { clock: new ClockPage(), id };
