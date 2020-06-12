/* global Promise */
var polyfill = require('es6-promise');

// istanbul ignore next
module.exports = typeof Promise === 'undefined' ? polyfill.Promise : Promise;
