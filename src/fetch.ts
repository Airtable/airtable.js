import nodeFetch from 'node-fetch';

export = (
    // istanbul ignore next
    typeof window === 'undefined' || typeof window.fetch === 'undefined' ? (nodeFetch as typeof fetch) : fetch
);
