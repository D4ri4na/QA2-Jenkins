const { config: local } = require('./wdio.conf');
const cloud = require('../config/browserstack.cjs');

exports.config = {
    ...local, ...cloud.connection(), hostname: 'hub.browserstack.com',
    capabilities: [{
        browserName: 'chrome', browserVersion: 'latest',
        'wdio:enforceWebDriverClassic': true,
        'bstack:options': { ...cloud.options('Practico 4 - WebdriverIO'), os: 'Windows', osVersion: '11' }
    }],
    after: async result => cloud.markSession(result)
};
