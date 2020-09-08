// istanbul ignore file
let AbortController: new () => AbortController;
if (typeof window === 'undefined') {
    AbortController = require('abort-controller');
} else if (typeof window.Request !== 'undefined' && 'signal' in new window.Request('')) {
    AbortController = window.AbortController;
} else {
    const polyfill = require('abortcontroller-polyfill/dist/cjs-ponyfill');
    AbortController = polyfill.AbortController;
}

export = AbortController;
