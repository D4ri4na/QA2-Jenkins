const fs = require('node:fs');
const path = require('node:path');
const { prepare, record, finish } = require('./reporters/html-report.cjs');

const chromeOptions = {
    args: ['--window-size=1365,900', ...(process.env.HEADLESS === 'false' ? [] : ['--headless=new'])]
};
const chromeBinary = process.env.CHROME_BINARY || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
].find(candidate => fs.existsSync(candidate));
if (chromeBinary) chromeOptions.binary = chromeBinary;

const capability = { browserName: 'chrome', 'goog:chromeOptions': chromeOptions };
if (process.env.CHROMEDRIVER_PATH) {
    capability['wdio:chromedriverOptions'] = { binary: process.env.CHROMEDRIVER_PATH };
}

exports.config = {
    runner: 'local',
    specs: ['./test/**/*.js'],
    maxInstances: 1,
    capabilities: [capability],
    logLevel: 'warn',
    outputDir: path.join(__dirname, 'reports', 'logs'),
    bail: 0,
    waitforTimeout: 15000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 2,
    framework: 'mocha',
    reporters: ['spec', ['junit', {
        outputDir: path.join(__dirname, 'reports', 'junit'),
        outputFileFormat: options => `results-${options.cid}.xml`
    }]],
    mochaOpts: { ui: 'bdd', timeout: 60000 },
    onPrepare: prepare,
    afterTest: async function (test, context, { error, duration, passed }) {
        record({ name: test.title, suite: test.parent, duration, passed, error: error ? error.message : '' });
        if (!passed) {
            await browser.saveScreenshot(path.join(__dirname, 'reports', 'screenshots', `failure-${Date.now()}.png`));
        }
    },
    onComplete: finish
};
