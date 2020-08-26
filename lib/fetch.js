var fetch = require('node-fetch').default;

// istanbul ignore next
module.exports = typeof window === 'undefined' ? fetch : window.fetch;
