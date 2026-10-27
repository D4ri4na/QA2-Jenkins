describe('Practico 4', () => {

    it('Deberia marcar el primer checkbox si esta desmarcado', async () => {
        await browser.url('https://the-internet.herokuapp.com/checkboxes');

        const checkbox1 = await $('#checkboxes input:first-child');
        const isChecked = await checkbox1.isSelected();

        if (!isChecked) {
            await checkbox1.click();
        }

        await expect(checkbox1).toBeSelected();
    });

    it('Deberia seleccionar la opcion 2 del menu desplegable', async () => {
        await browser.url('https://the-internet.herokuapp.com/dropdown');

        const dropdown = await $('#dropdown');
        await dropdown.selectByAttribute('value', '2');

        const option2 = await $('option[value="2"]');

        await expect(option2).toBeSelected();
    });

    it('Deberia agregar y eliminar un elemento', async () => {
        await browser.url('https://the-internet.herokuapp.com/add_remove_elements/');

        const addButton = await $('button[onclick="addElement()"]');
        await addButton.click();

        const deleteButton = await $('.added-manually');
        await expect(deleteButton).toBeDisplayed();

        await deleteButton.click();

        await expect(deleteButton).not.toBeDisplayed();
    });

    it('Deberia aceptar una alerta y validar el mensaje', async () => {
        await browser.url('https://the-internet.herokuapp.com/javascript_alerts');

        const alertButton = await $('button[onclick="jsAlert()"]');
        let alertAccepted = false;
        let alertError;
        const handleDialog = async (dialog) => {
            try {
                await dialog.accept();
                alertAccepted = true;
            } catch (error) {
                alertError = error;
            }
        };
        browser.on('dialog', handleDialog);
        try {
            await alertButton.click();
            await browser.waitUntil(() => alertAccepted || Boolean(alertError), {
                timeout: 10000,
                timeoutMsg: 'La alerta no se acepto dentro del tiempo esperado'
            });
            if (alertError) throw alertError;
        } finally {
            browser.off('dialog', handleDialog);
        }

        const resultText = await $('#result');

        await expect(resultText).toHaveText('You successfully clicked an alert');
    });

    it('Deberia mostrar la informacion de perfil', async () => {
        await browser.url('https://the-internet.herokuapp.com/hovers');

        const avatar = await $('.figure');
        await avatar.moveTo();

        const caption = await $('.figcaption');
        await expect(caption).toBeDisplayed();

        await expect(caption).toHaveText(expect.stringContaining('name: user1'));
    });

});
