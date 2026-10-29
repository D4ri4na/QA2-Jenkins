const { config: shared } = require('./wdio.shared.conf');

exports.config = {
    ...shared,
    hostname: '127.0.0.1', port: Number(process.env.APPIUM_PORT || 4723), path: '/',
    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': process.env.ANDROID_DEVICE || 'emulator-5554',
        'appium:udid': process.env.ANDROID_DEVICE || 'emulator-5554',
        'appium:appPackage': 'com.google.android.deskclock',
        'appium:appActivity': 'com.android.deskclock.DeskClock',
        'appium:autoGrantPermissions': true,
        'appium:noReset': true,
        'appium:forceAppLaunch': true,
        'appium:newCommandTimeout': 180,
        'appium:uiautomator2ServerLaunchTimeout': 120000,
        'appium:disableWindowAnimation': true
    }]
};
