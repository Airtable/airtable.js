var AbortController = require('abort-controller');

// istanbul ignore next
module.exports = typeof window === 'undefined' ? AbortController : window.AbortController;
