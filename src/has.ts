'use strict';

function has(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
}

module.exports = has;
