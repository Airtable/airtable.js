// istanbul ignore file
let AbortController: new () => AbortController;
const browserGlobal =
    typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : null; // self is the global in web workers
if (!browserGlobal) {
    AbortController = require('abort-controller');
} else if ('signal' in new Request('')) {
    AbortController = browserGlobal.AbortController;
} else {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const polyfill = require('abortcontroller-polyfill/dist/cjs-ponyfill');
    /* eslint-enable @typescript-eslint/no-var-requires */
    AbortController = polyfill.AbortController;
}

export = AbortController;
