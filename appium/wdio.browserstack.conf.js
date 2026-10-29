const { config: shared } = require('./wdio.shared.conf');
const cloud = require('../config/browserstack.cjs');

exports.config = {
    ...shared, ...cloud.connection(),
    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:app': cloud.app(),
        'appium:appPackage': 'com.google.android.deskclock',
        'appium:appActivity': 'com.android.deskclock.DeskClock',
        'appium:autoGrantPermissions': true,
        'bstack:options': {
            ...cloud.options('Practico 7 - Appium Reloj'),
            deviceName: process.env.BROWSERSTACK_DEVICE || 'Google Pixel 8',
            osVersion: process.env.BROWSERSTACK_OS_VERSION || '14.0'
        }
    }],
    after: async result => cloud.markSession(result)
};
