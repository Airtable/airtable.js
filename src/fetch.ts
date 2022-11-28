// istanbul ignore file
import nodeFetch from 'node-fetch';

const browserGlobal =
    typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : null; // self is the global in web workers

export = !browserGlobal ? (nodeFetch as typeof fetch) : browserGlobal.fetch.bind(browserGlobal);
