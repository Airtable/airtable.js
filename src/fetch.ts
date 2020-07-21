import nodeFetch from 'node-fetch';

// istanbul ignore next
export = typeof window === 'undefined' ? (nodeFetch as typeof fetch) : fetch;
