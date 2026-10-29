describe('Practico 7 - App de Tiempo', () => {

  const goToTab = async (tabName) => {
    let tabSelector;
    switch (tabName) {
      case 'Alarm':
        tabSelector = await $('id=com.google.android.deskclock:id/tab_menu_alarm');
        if (!(await tabSelector.isExisting())) tabSelector = await $('~Alarms');
        break;
      case 'Clock':
        tabSelector = await $('id=com.google.android.deskclock:id/tab_menu_clock');
        if (!(await tabSelector.isExisting())) tabSelector = await $('~World Clock');
        break;
      case 'Timer':
        tabSelector = await $('id=com.google.android.deskclock:id/tab_menu_timer');
        if (!(await tabSelector.isExisting())) tabSelector = await $('~Timers');
        break;
      case 'Stopwatch':
        tabSelector = await $('id=com.google.android.deskclock:id/tab_menu_stopwatch');
        if (!(await tabSelector.isExisting())) tabSelector = await $('~Stopwatch');
        break;
    }
    if (await tabSelector.isExisting()) {
      await tabSelector.click();
      await driver.pause(1000);
    }
  };

  it('Desactivar una alarma activa existente', async () => {
    await goToTab('Alarm');

    const switches = await $$('android.widget.Switch');
    if (switches.length > 0) {
      await switches[0].click();
    } else {
      const alarmSwitch = await $('id=com.google.android.deskclock:id/onoff');
      await alarmSwitch.click();
    }
    await driver.pause(1000);
  });

  it('Crear una nueva alarma en horario PM', async () => {
    await goToTab('Alarm');

    let addButton = await $('id=com.google.android.deskclock:id/fab');
    if (!(await addButton.isExisting())) {
      addButton = await $('~Add alarm');
    }
    await addButton.click();

    const hour = await $('android=new UiSelector().text("4")');
    if (await hour.isExisting()) {
      await hour.click();
    }

    const minute = await $('android=new UiSelector().text("15")');
    if (await minute.isExisting()) {
      await minute.click();
    }

    let pmBtn = await $('id=com.google.android.deskclock:id/material_clock_period_pm_button');
    if (!(await pmBtn.isExisting())) {
      pmBtn = await $('android=new UiSelector().text("PM")');
    }
    if (await pmBtn.isExisting()) {
      await pmBtn.click();
    }

    const okBtn = await $('id=com.google.android.deskclock:id/material_timepicker_ok_button');
    if (await okBtn.isExisting()) {
      await okBtn.click();
    }

    const newAlarm = await $('android=new UiSelector().textContains("4:15")');
    await expect(newAlarm).toBeDisplayed();
  });

  it('Expandir una alarma y añadirle una etiqueta', async () => {
    await goToTab('Alarm');

    const alarmCards = await $$('id=com.google.android.deskclock:id/alarm_card');
    if (alarmCards.length > 0) {
      await alarmCards[0].click();
    } else {
      const arrows = await $$('id=com.google.android.deskclock:id/arrow');
      if (arrows.length > 0) {
        await arrows[0].click();
      }
    }

    let editLabel = await $('id=com.google.android.deskclock:id/label_setting');
    if (!(await editLabel.isExisting())) {
      editLabel = await $('id=com.google.android.deskclock:id/edit_label');
    }
    await editLabel.click();

    let labelInput = await $('id=com.google.android.deskclock:id/alarm_label_edit');
    if (!(await labelInput.isExisting())) {
      labelInput = await $('id=com.google.android.deskclock:id/label_input_field');
    }
    if (!(await labelInput.isExisting())) {
      labelInput = await $('android.widget.EditText');
    }
    await labelInput.setValue("practico7");

    const okBtn = await $('android=new UiSelector().text("OK")');
    if (await okBtn.isExisting()) {
      await okBtn.click();
    } else {
      const saveBtn = await $('id=com.google.android.deskclock:id/save_button');
      if (await saveBtn.isExisting()) {
        await saveBtn.click();
      }
    }

    const labelConfirm = await $('android=new UiSelector().textContains("practico7")');
    await expect(labelConfirm).toBeDisplayed();
  });

  it('4. Iniciar y pausar el cronómetro', async () => {
    await goToTab('Stopwatch');

    let playBtn = await $('id=com.google.android.deskclock:id/start_stop_button');
    if (!(await playBtn.isExisting())) {
      playBtn = await $('id=com.google.android.deskclock:id/fab');
    }
    await playBtn.click();

    await driver.pause(3000);

    await playBtn.click();
  });

  it('Configurar temporizador de 1 minuto', async () => {
    await goToTab('Timer');

    let btn1 = await $('id=com.google.android.deskclock:id/timer_setup_digit_1');
    if (!(await btn1.isExisting())) btn1 = await $('android=new UiSelector().text("1")');

    let btn0 = await $('id=com.google.android.deskclock:id/timer_setup_digit_0');
    if (!(await btn0.isExisting())) btn0 = await $('android=new UiSelector().text("0")');

    await btn1.click();
    await btn0.click();
    await btn0.click();

    let startTimerBtn = await $('id=com.google.android.deskclock:id/add_timer_button');
    if (!(await startTimerBtn.isExisting())) {
      startTimerBtn = await $('id=com.google.android.deskclock:id/fab');
    }
    await startTimerBtn.click();

    await driver.pause(2000);
  });

  it('Configurar repeticion de alarma para dias especificos', async () => {
    await goToTab('Alarm');

    const alarmCards = await $$('id=com.google.android.deskclock:id/alarm_card');
    if (alarmCards.length > 0) {
      await alarmCards[0].click();
    } else {
      const arrows = await $$('id=com.google.android.deskclock:id/arrow');
      if (arrows.length > 0) {
        await arrows[0].click();
      }
    }

    let monday = await $('id=com.google.android.deskclock:id/day_button_1');
    if (!(await monday.isExisting())) monday = await $('~Monday');

    let wednesday = await $('id=com.google.android.deskclock:id/day_button_3');
    if (!(await wednesday.isExisting())) wednesday = await $('~Wednesday');

    let friday = await $('id=com.google.android.deskclock:id/day_button_5');
    if (!(await friday.isExisting())) friday = await $('~Friday');

    await monday.click();
    await wednesday.click();
    await friday.click();

    const saveBtn = await $('id=com.google.android.deskclock:id/save_button');
    if (await saveBtn.isExisting()) {
      await saveBtn.click();
    }

    await driver.pause(2000);

    const daysText = await $('id=com.google.android.deskclock:id/days_of_week');
    await expect(daysText).toBeDisplayed();
  });

  it('Agregar una ciudad en el Reloj Mundial', async () => {
    await goToTab('Clock');

    const addCityBtn = await $('id=com.google.android.deskclock:id/fab');
    await addCityBtn.click();

    let searchInput = await $('id=com.google.android.deskclock:id/open_search_view_edit_text');
    if (!(await searchInput.isExisting())) {
      searchInput = await $('id=com.google.android.deskclock:id/search_src_text');
    }
    await searchInput.setValue('La Paz');

    const cityResults = await $$('id=com.google.android.deskclock:id/city_name');
    if (cityResults.length > 0) {
      await cityResults[0].click();
    } else {
      const cityText = await $('android=new UiSelector().textContains("La Paz")');
      await cityText.click();
    }

    if (await searchInput.isExisting()) {
      await driver.back();
    }

    const addedCity = await $('android=new UiSelector().textContains("La Paz")');
    await expect(addedCity).toBeDisplayed();
  });

});