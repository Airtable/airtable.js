var fetch = require('node-fetch');

// istanbul ignore next
module.exports = typeof window === 'undefined' ? fetch : window.fetch;
