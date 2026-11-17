// Algunos servidores de BrowserStack no ofrecen mobile: getCurrentPackage.
// WDIO 9.31.5 no reconoce su respuesta "unknown command" como motivo de fallback.
async function getCurrentPackage(driver) {
    try {
        return await driver.getCurrentPackage();
    } catch (error) {
        if (!/Unknown mobile command\s+["']getCurrentPackage["']/i.test(error.message || '')) throw error;
        return driver.appiumGetCurrentPackage();
    }
}

module.exports = { getCurrentPackage };
