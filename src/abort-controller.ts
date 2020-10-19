// istanbul ignore file
let AbortController: new () => AbortController;

if (typeof window === 'undefined' || typeof window.Request === 'undefined') {
    AbortController = require('abort-controller');
} else if ('signal' in new window.Request('')) {
    AbortController = window.AbortController;
} else {
    const polyfill = require('abortcontroller-polyfill/dist/cjs-ponyfill');
    AbortController = polyfill.AbortController;
}

export = AbortController;
