const fs = require('node:fs');
const path = require('node:path');
const { createReporter } = require('../webDriveIO/reporters/html-report.cjs');
const report = createReporter(path.join(__dirname, 'reports'), 'Appium - Reloj Android');

exports.config = {
    runner: 'local', specs: ['./test/**/*.js'], maxInstances: 1,
    logLevel: 'warn', outputDir: path.join(__dirname, 'reports/logs'),
    waitforTimeout: 15000, connectionRetryTimeout: 180000, connectionRetryCount: 1,
    framework: 'mocha', mochaOpts: { ui: 'bdd', timeout: 90000 },
    reporters: ['spec', ['junit', {
        outputDir: path.join(__dirname, 'reports/junit'),
        outputFileFormat: ({ cid }) => `results-${cid}.xml`
    }]],
    onPrepare: report.prepare,
    afterTest: async (test, context, { error, duration, passed }) => {
        report.record({ name: test.title, suite: test.parent, duration, passed, error: error?.message || '' });
        if (!passed) {
            try {
                const stamp = Date.now();
                await browser.saveScreenshot(path.join(__dirname, 'reports/screenshots', `failure-${stamp}.png`));
                fs.writeFileSync(path.join(__dirname, 'reports/screenshots', `failure-${stamp}.xml`), await browser.getPageSource());
            }
            catch (captureError) { console.warn(`No se pudo guardar captura: ${captureError.message}`); }
        }
    },
    onComplete: report.finish
};
