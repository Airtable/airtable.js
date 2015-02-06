'use strict';

var Class = require('./class');

var AirtableError = Class.extend({
    init: function(error, message, statusCode) {
        this.error = error;
        this.message = message;
        this.statusCode = statusCode;
    },
    toString: function() {
        return [
            this.message,
            '(', this.error, ')',
            this.statusCode ?  '[Http code ' + this.statusCode + ']' : ''
        ].join('');
    }
});

module.exports = AirtableError;
