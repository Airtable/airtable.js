// istanbul ignore file
import nodeFetch from 'node-fetch';

export = typeof window === 'undefined' ? (nodeFetch as typeof fetch) : window.fetch.bind(window);
