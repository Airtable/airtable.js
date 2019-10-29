/* global Promise */
var polyfill = require('es6-promise');

module.exports = typeof Promise === 'undefined' ? polyfill.Promise : Promise;
