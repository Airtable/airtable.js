// istanbul ignore file
let AbortController: new () => AbortController;
if (typeof window === 'undefined') {
    AbortController = require('abort-controller');
} else if ('signal' in new Request('')) {
    AbortController = window.AbortController;
} else {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const polyfill = require('abortcontroller-polyfill/dist/cjs-ponyfill');
    /* eslint-enable @typescript-eslint/no-var-requires */
    AbortController = polyfill.AbortController;
}

export = AbortController;
