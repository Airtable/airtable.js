// istanbul ignore file
let AbortController: new () => AbortController;
if (typeof window === 'undefined') {
    AbortController = require('abort-controller');
} else if ('signal' in new Request('')) {
    AbortController = window.AbortController;
} else {
    /* eslint-disable-next-line */
    const polyfill = require('abortcontroller-polyfill/dist/cjs-ponyfill');
    AbortController = polyfill.AbortController;
}

export = AbortController;
