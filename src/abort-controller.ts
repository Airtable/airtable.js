// istanbul ignore file
if (typeof window === 'undefined') {
    module.exports = require('abort-controller');
} else {
    if ('signal' in new Request('')) {
        module.exports = window.AbortController;
    } else {
        var polyfill = require('abortcontroller-polyfill/dist/cjs-ponyfill');
        module.exports = polyfill.AbortController;
    }
}
