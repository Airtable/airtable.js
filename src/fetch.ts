import nodeFetch from 'node-fetch';

export = (
    // istanbul ignore next
    typeof window === 'undefined' ? (nodeFetch as typeof fetch) : window.fetch.bind(window)
);
