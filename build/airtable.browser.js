require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./class":4}],2:[function(require,module,exports){
'use strict';

var _ = require('../other/lodash.custom.min.js');
var internalConfig = require('./internal_config.json');
var Class = require('./class');
var AirtableError = require('./airtable_error');
var Table = require('./table');
var runAction = require('./run_action');

var Base = Class.extend({
    init: function(airtable, baseId) {
        this._airtable = airtable;
        this._id = baseId;
    },

    table: function(tableName) {
        return new Table(this, null, tableName);
    },

    runAction: function(method, path, queryParams, bodyData, callback) {
        runAction(this, method, path, queryParams, bodyData, callback);
    },

    _checkStatusForError: function(statusCode, body) {
        if (statusCode === 401) {
            return new AirtableError('AUTHENTICATION_REQUIRED', 'You should provide valid api key to perform this operation', statusCode);
        } else if (statusCode === 403) {
            return new AirtableError('NOT_AUTHORIZED', 'You are not authorized to perform this operation', statusCode);
        } else if (statusCode === 404) {
            return (function(){
                var message = (body && body.error && body.error.message) ? body.error.message : 'Could not find what you are looking for';
                return new AirtableError('NOT_FOUND', message, statusCode);
            })();
        } else if (statusCode === 413) {
            return new AirtableError('REQUEST_TOO_LARGE', 'Request body is too large', statusCode);
        } else if (statusCode === 422) {
            return (function(){
                var type = (body && body.error && body.error.type) ? body.error.type : 'UNPROCESSABLE_ENTITY';
                var message = (body && body.error && body.error.message) ? body.error.message : 'The operation cannot be processed';
                return new AirtableError(type, message, statusCode);
            })();
        } else if (statusCode === 429) {
            return new AirtableError('TOO_MANY_REQUESTS', 'You have made too many requests in a short period of time. Please retry your request later', statusCode);
        }else if (statusCode === 500) {
            return new AirtableError('SERVER_ERROR', 'Try again. If the problem persists, contact support.', statusCode);
        } else if (statusCode === 503) {
            return new AirtableError('SERVICE_UNAVAILABLE', 'The service is temporarily unavailable. Please retry shortly.', statusCode);
        } else if (statusCode >= 400) {
            return (function(){
                var type = (body && body.error && body.error.type) ? body.error.type : 'UNEXPECTED_ERROR';
                var message = (body && body.error && body.error.message) ? body.error.message : 'An unexpected error occurred';
                return new AirtableError(type, message, statusCode);
            })();
        }
    },

    doCall: function(tableName) {
        return this.table(tableName);
    },

    getId: function() {
        return this._id;
    }
});

Base.createFunctor = function(airtable, baseId) {
    var base = new Base(airtable, baseId);
    var baseFn = function() {
        return base.doCall.apply(base, arguments);
    };
    _.each(['table', 'runAction', 'getId'], function(baseMethod) {
        baseFn[baseMethod] = base[baseMethod].bind(base);
    });
    baseFn._base = base;
    baseFn.tables = base.tables;
    return baseFn;
};

module.exports = Base;

},{"../other/lodash.custom.min.js":29,"./airtable_error":1,"./class":4,"./internal_config.json":6,"./run_action":10,"./table":11}],3:[function(require,module,exports){
'use strict';

/**
 * Given a function fn that takes a callback as its last argument, returns
 * a new version of the function that takes the callback optionally. If
 * the function is not called with a callback for the last argument, the
 * function will return a promise instead.
 */
function callbackToPromise(fn, context, callbackArgIndex) {
    return function() {
        // If callbackArgIndex isn't provided, use the last argument.
        if (callbackArgIndex === undefined) {
            callbackArgIndex = arguments.length > 0 ? arguments.length - 1 : 0;
        }
        var callbackArg = arguments[callbackArgIndex];
        if (typeof callbackArg === 'function') {
            fn.apply(context, arguments);
        } else {
            var args = [];
            // If an explicit callbackArgIndex is set, but the function is called
            // with too few arguments, we want to push undefined onto args so that
            // our constructed callback ends up at the right index.
            var argLen = Math.max(arguments.length, callbackArgIndex);
            for (var i = 0; i < argLen; i++) {
                args.push(arguments[i]);
            }
            return new Promise(function(resolve, reject) {
                args.push(function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
                fn.apply(context, args);
            });
        }
    };
}

module.exports = callbackToPromise;

},{}],4:[function(require,module,exports){
// jshint ignore: start

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    var Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function extender(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
            prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = extender;

        return Class;
    };

    if (typeof exports !== 'undefined') {
        module.exports = Class;
    } else {
        window.Class = Class;
    }
})();

},{}],5:[function(require,module,exports){
'use strict';

var didWarnForDeprecation = {};

/**
 * Convenience function for marking a function as deprecated.
 *
 * Will emit a warning the first time that function is called.
 *
 * @param fn the function to mark as deprecated.
 * @param key a unique key identifying the function.
 * @param message the warning message.
 *
 * @return a wrapped function
 */
function deprecate(fn, key, message) {
    return function() {
        if (!didWarnForDeprecation[key]) {
            didWarnForDeprecation[key] = true;
            console.warn(message);
        }
        fn.apply(this, arguments);
    };
}

module.exports = deprecate;


},{}],6:[function(require,module,exports){
module.exports={
    "RETRY_DELAY_IF_RATE_LIMITED": 5000
}

},{}],7:[function(require,module,exports){
'use strict';

var _ = require('../other/lodash.custom.min.js');

// Adapted from jQuery.param:
// https://github.com/jquery/jquery/blob/2.2-stable/src/serialize.js
function buildParams(prefix, obj, addFn) {
    var name;
    if (_.isArray(obj)) {
        // Serialize array item.
        _.each(obj, function(value, index) {
            if (/\[\]$/.test(prefix)) {
                // Treat each array item as a scalar.
                addFn(prefix, value);
            } else {
                // Item is non-scalar (array or object), encode its numeric index.
                buildParams(
                    prefix + '[' + (typeof value === 'object' && value !== null && value !== undefined ? index : '') + ']',
                    value,
                    addFn
                );
            }
        });
    } else if (typeof obj === 'object') {
        // Serialize object item.
        for (name in obj) {
            buildParams(prefix + '[' + name + ']', obj[name], addFn);
        }
    } else {
        // Serialize scalar item.
        addFn(prefix, obj);
    }
}

function objectToQueryParamString(obj) {
    var parts = [];
    var addFn = function(key, value) {
        value = (value === null || value === undefined) ? '' : value;
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    };

    _.each(_.keys(obj), function(key) {
        var value = obj[key];
        buildParams(key, value, addFn);
    });

    return parts.join('&').replace(/%20/g, '+');
}

module.exports = objectToQueryParamString;

},{"../other/lodash.custom.min.js":29}],8:[function(require,module,exports){
'use strict';

var assert = require('assert');
var _ = require('../other/lodash.custom.min.js');

var check = require('./typecheck');
var Class = require('./class');
var Record = require('./record');
var callbackToPromise = require('./callback_to_promise');

var Query = Class.extend({
    /**
     * Builds a query object. Won't fetch until `firstPage` or
     * or `eachPage` is called.
     */
    init: function(table, params) {
        assert(_.isPlainObject(params));
        _.each(_.keys(params), function(key) {
            var value = params[key];
            assert(Query.paramValidators[key] && Query.paramValidators[key](value).pass, 'Invalid parameter for Query: ' + key);
        });

        this._table = table;
        this._params = params;

        this.firstPage = callbackToPromise(this.firstPage, this);
        this.eachPage = callbackToPromise(this.eachPage, this, 1);
        this.all = callbackToPromise(this.all, this);
    },

    /**
     * Fetches the first page of results for the query asynchronously,
     * then calls `done(error, records)`.
     */
    firstPage: function(done) {
        assert(_.isFunction(done),
            'The first parameter to `firstPage` must be a function');

        this.eachPage(function(records, fetchNextPage) {
            done(null, records);
        }, function(error) {
            done(error, null);
        });
    },

    /**
     * Fetches each page of results for the query asynchronously.
     *
     * Calls `pageCallback(records, fetchNextPage)` for each
     * page. You must call `fetchNextPage()` to fetch the next page of
     * results.
     *
     * After fetching all pages, or if there's an error, calls
     * `done(error)`.
     */
    eachPage: function(pageCallback, done) {
        assert(_.isFunction(pageCallback),
            'The first parameter to `eachPage` must be a function');

        assert(_.isFunction(done) || _.isUndefined(done),
            'The second parameter to `eachPage` must be a function or undefined');

        var that = this;
        var path = '/' + this._table._urlEncodedNameOrId();
        var params = _.clone(this._params);

        var inner = function() {
            that._table._base.runAction('get', path, params, null, function(err, response, result) {
                if (err) {
                    done(err, null);
                } else {
                    var next;
                    if (result.offset) {
                        params.offset = result.offset;
                        next = inner;
                    } else {
                        next = function() {
                            if (done) {
                                done(null);
                            }
                        };
                    }

                    var records = _.map(result.records, function(recordJson) {
                        return new Record(that._table, null, recordJson);
                    });

                    pageCallback(records, next);
                }
            });
        };

        inner();
    },
    /**
     * Fetches all pages of results asynchronously. May take a long time.
     */
    all: function(done) {
        assert(_.isFunction(done),
            'The first parameter to `all` must be a function');

        var allRecords = [];
        this.eachPage(function(pageRecords, fetchNextPage) {
            allRecords.push.apply(allRecords, pageRecords);
            fetchNextPage();
        }, function(err) {
            if (err) {
                done(err, null);
            } else {
                done(null, allRecords);
            }
        });
    }
});

Query.paramValidators = {
    fields:
        check(check.isArrayOf(_.isString), 'the value for `fields` should be an array of strings'),

    filterByFormula:
        check(_.isString, 'the value for `filterByFormula` should be a string'),

    maxRecords:
        check(_.isNumber, 'the value for `maxRecords` should be a number'),

    pageSize:
        check(_.isNumber, 'the value for `pageSize` should be a number'),

    sort:
        check(check.isArrayOf(function(obj) {
            return (
                _.isPlainObject(obj) &&
                _.isString(obj.field) &&
                (_.isUndefined(obj.direction) || _.includes(['asc', 'desc'], obj.direction))
            );
        }), 'the value for `sort` should be an array of sort objects. ' +
            'Each sort object must have a string `field` value, and an optional ' +
            '`direction` value that is "asc" or "desc".'
        ),

    view:
        check(_.isString, 'the value for `view` should be a string'),

    cellFormat:
        check(function(cellFormat) {
            return (
                _.isString(cellFormat) &&
                _.includes(['json', 'string'], cellFormat)
            );
        }, 'the value for `cellFormat` should be "json" or "string"'),

    timeZone:
        check(_.isString, 'the value for `timeZone` should be a string'),

    userLocale:
        check(_.isString, 'the value for `userLocale` should be a string'),
};

/**
 * Validates the parameters for passing to the Query constructor.
 *
 * @return an object with two keys:
 *  validParams: the object that should be passed to the constructor.
 *  ignoredKeys: a list of keys that will be ignored.
 *  errors: a list of error messages.
 */
Query.validateParams = function validateParams(params) {
    assert(_.isPlainObject(params));

    var validParams = {};
    var ignoredKeys = [];
    var errors = [];
    _.each(_.keys(params), function(key) {
        var value = params[key];
        if (Query.paramValidators.hasOwnProperty(key)) {
            var validator = Query.paramValidators[key];
            var validationResult = validator(value);
            if (validationResult.pass) {
                validParams[key] = value;
            } else {
                errors.push(validationResult.error);
            }
        } else {
            ignoredKeys.push(key);
        }
    });

    return {
        validParams: validParams,
        ignoredKeys: ignoredKeys,
        errors: errors,
    };
};

module.exports = Query;

},{"../other/lodash.custom.min.js":29,"./callback_to_promise":3,"./class":4,"./record":9,"./typecheck":12,"assert":13}],9:[function(require,module,exports){
'use strict';

var _ = require('../other/lodash.custom.min.js');

var Class = require('./class');
var callbackToPromise = require('./callback_to_promise');

var Record = Class.extend({
    init: function(table, recordId, recordJson) {
        this._table = table;
        this.id = recordId || recordJson.id;
        this.setRawJson(recordJson);

        this.save = callbackToPromise(this.save, this);
        this.patchUpdate = callbackToPromise(this.patchUpdate, this);
        this.putUpdate = callbackToPromise(this.putUpdate, this);
        this.destroy = callbackToPromise(this.destroy, this);
        this.fetch = callbackToPromise(this.fetch, this);

        this.updateFields = this.patchUpdate;
        this.replaceFields = this.putUpdate;
    },
    getId: function() {
        return this.id;
    },
    get: function(columnName) {
        return this.fields[columnName];
    },
    set: function(columnName, columnValue) {
        this.fields[columnName] = columnValue;
    },
    save: function(done) {
        this.putUpdate(this.fields, done);
    },
    patchUpdate: function(cellValuesByName, opts, done) {
        var that = this;
        if (!done) {
            done = opts;
            opts = {};
        }
        var updateBody = _.extend({
            fields: cellValuesByName
        }, opts);

        this._table._base.runAction('patch', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, updateBody, function(err, response, results) {
            if (err) { done(err); return; }

            that.setRawJson(results);
            done(null, that);
        });
    },
    putUpdate: function(cellValuesByName, opts, done) {
        var that = this;
        if (!done) {
            done = opts;
            opts = {};
        }
        var updateBody = _.extend({
            fields: cellValuesByName
        }, opts);
        this._table._base.runAction('put', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, updateBody, function(err, response, results) {
            if (err) { done(err); return; }

            that.setRawJson(results);
            done(null, that);
        });
    },
    destroy: function(done) {
        var that = this;
        this._table._base.runAction('delete', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, null, function(err, response, results) {
            if (err) { done(err); return; }

            done(null, that);
        });
    },

    fetch: function(done) {
        var that = this;
        this._table._base.runAction('get', '/' + this._table._urlEncodedNameOrId() + '/' + this.id, {}, null, function(err, response, results) {
            if (err) { done(err); return; }

            that.setRawJson(results);
            done(null, that);
        });
    },
    setRawJson: function(rawJson) {
        this._rawJson = rawJson;
        this.fields = (this._rawJson && this._rawJson.fields) || {};
    }
});

module.exports = Record;

},{"../other/lodash.custom.min.js":29,"./callback_to_promise":3,"./class":4}],10:[function(require,module,exports){
'use strict';

var internalConfig = require('./internal_config.json');
var objectToQueryParamString = require('./object_to_query_param_string');

// This will become require('xhr') in the browser.
var request = require('request');

function runAction(base, method, path, queryParams, bodyData, callback) {
    var url = base._airtable._endpointUrl + '/v' + base._airtable._apiVersionMajor + '/' + base._id + path + '?' + objectToQueryParamString(queryParams);

    var headers = {
        'authorization': 'Bearer ' + base._airtable._apiKey,
        'x-api-version': base._airtable._apiVersion,
        'x-airtable-application-id': base.getId(),
    };

    var userAgent = 'Airtable.js/' + "0.5.7";
    var isBrowser = typeof window !== 'undefined';
    // Some browsers do not allow overriding the user agent.
    // https://github.com/Airtable/airtable.js/issues/52
    if (isBrowser) {
        headers['x-airtable-user-agent'] = userAgent;
    } else {
        headers['User-Agent'] = userAgent;
    }


    var options = {
        method: method.toUpperCase(),
        url: url,
        json: true,
        timeout: base._airtable.requestTimeout,
        headers: headers,
        // agentOptions are ignored when running in the browser.
        agentOptions: {
            rejectUnauthorized: base._airtable._allowUnauthorizedSsl
        },
    };

    if (bodyData !== null) {
        options.body = bodyData;
    }

    request(options, function(error, resp, body) {
        if (error) {
            callback(error, resp, body);
            return;
        }

        if (resp.statusCode === 429 && !base._airtable._noRetryIfRateLimited) {
            setTimeout(function() {
                runAction(base, method, path, queryParams, bodyData, callback);
            }, internalConfig.RETRY_DELAY_IF_RATE_LIMITED);
            return;
        }

        error = base._checkStatusForError(resp.statusCode, body);
        callback(error, resp, body);
    });
}

module.exports = runAction;

},{"./internal_config.json":6,"./object_to_query_param_string":7,"request":27}],11:[function(require,module,exports){
'use strict';

var _ = require('../other/lodash.custom.min.js');

var assert = require('assert');
var async = require('async');

var AirtableError = require('./airtable_error');
var Class = require('./class');
var deprecate = require('./deprecate');
var Query = require('./query');
var Record = require('./record');
var callbackToPromise = require('./callback_to_promise');

var Table = Class.extend({
    init: function(base, tableId, tableName) {
        this._base = base;
        assert(tableId || tableName, 'Table name or table ID is required');
        this.id = tableId;
        this.name = tableName;

        // Public API
        this.find = callbackToPromise(this._findRecordById, this);
        this.select = this._selectRecords.bind(this);
        this.create = callbackToPromise(this._createRecord, this);
        this.update = callbackToPromise(this._updateRecord, this);
        this.destroy = callbackToPromise(this._destroyRecord, this);
        this.replace = callbackToPromise(this._replaceRecord, this);

        // Deprecated API
        this.list = deprecate(this._listRecords.bind(this),
            'table.list',
            'Airtable: `list()` is deprecated. Use `select()` instead.');
        this.forEach = deprecate(this._forEachRecord.bind(this),
            'table.forEach',
            'Airtable: `forEach()` is deprecated. Use `select()` instead.');
    },
    _findRecordById: function(recordId, done) {
        var record = new Record(this, recordId);
        record.fetch(done);
    },
    _selectRecords: function(params) {
        if (_.isUndefined(params)) {
            params = {};
        }

        if (arguments.length > 1) {
            console.warn('Airtable: `select` takes only one parameter, but it was given ' +
                arguments.length + ' parameters. ' +
                'Use `eachPage` or `firstPage` to fetch records.');
        }

        if (_.isPlainObject(params)) {
            var validationResults = Query.validateParams(params);

            if (validationResults.errors.length) {
                var formattedErrors = validationResults.errors.map(function(error) {
                    return '  * ' + error;
                });

                assert(false, 'Airtable: invalid parameters for `select`:\n' +
                    formattedErrors.join('\n'));
            }

            if (validationResults.ignoredKeys.length) {
                console.warn('Airtable: the following parameters to `select` will be ignored: ' +
                    validationResults.ignoredKeys.join(', '));
            }

            return new Query(this, validationResults.validParams);
        } else {
            assert(false, 'Airtable: the parameter for `select` should be a plain object or undefined.');
        }
    },
    _urlEncodedNameOrId: function(){
        return this.id || encodeURIComponent(this.name);
    },
    _createRecord: function(recordData, optionalParameters, done) {
        var that = this;
        if (!done) {
            done = optionalParameters;
            optionalParameters = {};
        }
        var requestData = _.extend({fields: recordData}, optionalParameters);
        this._base.runAction('post', '/' + that._urlEncodedNameOrId() + '/', {}, requestData, function(err, resp, body) {
            if (err) { done(err); return; }

            var record = new Record(that, body.id, body);
            done(null, record);
        });
    },
    _updateRecord: function(recordId, recordData, opts, done) {
        var record = new Record(this, recordId);
        if (!done) {
            done = opts;
            record.patchUpdate(recordData, done);
        } else {
            record.patchUpdate(recordData, opts, done);
        }
    },
    _replaceRecord: function(recordId, recordData, opts, done) {
        var record = new Record(this, recordId);
        if (!done) {
            done = opts;
            record.putUpdate(recordData, done);
        } else {
            record.putUpdate(recordData, opts, done);
        }
    },
    _destroyRecord: function(recordId, done) {
        var record = new Record(this, recordId);
        record.destroy(done);
    },
    _listRecords: function(limit, offset, opts, done) {
        var that = this;

        if (!done) {
            done = opts;
            opts = {};
        }
        var listRecordsParameters = _.extend({
            limit: limit, offset: offset
        }, opts);

        async.waterfall([
            function(next) {
                that._base.runAction('get', '/' + that._urlEncodedNameOrId() + '/', listRecordsParameters, null, next);
            },
            function(response, results, next) {
                var records = _.map(results.records, function(recordJson) {
                    return new Record(that, null, recordJson);
                });
                next(null, records, results.offset);
            }
        ], done);
    },
    _forEachRecord: function(opts, callback, done) {
        if (arguments.length === 2) {
            done = callback;
            callback = opts;
            opts = {};
        }
        var that = this;
        var limit = Table.__recordsPerPageForIteration || 100;
        var offset = null;

        var nextPage = function() {
            that._listRecords(limit, offset, opts, function(err, page, newOffset) {
                if (err) { done(err); return; }

                _.each(page, callback);

                if (newOffset) {
                    offset = newOffset;
                    nextPage();
                } else {
                    done();
                }
            });
        };
        nextPage();
    }
});

module.exports = Table;

},{"../other/lodash.custom.min.js":29,"./airtable_error":1,"./callback_to_promise":3,"./class":4,"./deprecate":5,"./query":8,"./record":9,"assert":13,"async":17}],12:[function(require,module,exports){
'use strict';

var _ = require('../other/lodash.custom.min.js');

function check(fn, error) {
    return function(value) {
        if (fn(value)) {
            return {pass: true};
        } else {
            return {pass: false, error: error};
        }
    };
}

check.isOneOf = function isOneOf(options) {
    return _.includes.bind(this, options);
};

check.isArrayOf = function(itemValidator) {
    return function(value) {
        return _.isArray(value) && _.every(value, itemValidator);
    };
};

module.exports = check;

},{"../other/lodash.custom.min.js":29}],13:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/":16}],14:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],15:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],16:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":15,"_process":18,"inherits":14}],17:[function(require,module,exports){
(function (process,global,setImmediate){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"_process":18,"timers":24}],18:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],19:[function(require,module,exports){
'use strict';

var isCallable = require('is-callable');

var toStr = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            if (receiver == null) {
                iterator(array[i], i, array);
            } else {
                iterator.call(receiver, array[i], i, array);
            }
        }
    }
};

var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        if (receiver == null) {
            iterator(string.charAt(i), i, string);
        } else {
            iterator.call(receiver, string.charAt(i), i, string);
        }
    }
};

var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            if (receiver == null) {
                iterator(object[k], k, object);
            } else {
                iterator.call(receiver, object[k], k, object);
            }
        }
    }
};

var forEach = function forEach(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
        throw new TypeError('iterator must be a function');
    }

    var receiver;
    if (arguments.length >= 3) {
        receiver = thisArg;
    }

    if (toStr.call(list) === '[object Array]') {
        forEachArray(list, iterator, receiver);
    } else if (typeof list === 'string') {
        forEachString(list, iterator, receiver);
    } else {
        forEachObject(list, iterator, receiver);
    }
};

module.exports = forEach;

},{"is-callable":21}],20:[function(require,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
'use strict';

var fnToStr = Function.prototype.toString;

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isCallable(value) {
	if (!value) { return false; }
	if (typeof value !== 'function' && typeof value !== 'object') { return false; }
	if (typeof value === 'function' && !value.prototype) { return true; }
	if (hasToStringTag) { return tryFunctionObject(value); }
	if (isES6ClassFn(value)) { return false; }
	var strClass = toStr.call(value);
	return strClass === fnClass || strClass === genClass;
};

},{}],22:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],23:[function(require,module,exports){
var trim = require('trim')
  , forEach = require('for-each')
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  forEach(
      trim(headers).split('\n')
    , function (row) {
        var index = row.indexOf(':')
          , key = trim(row.slice(0, index)).toLowerCase()
          , value = trim(row.slice(index + 1))

        if (typeof(result[key]) === 'undefined') {
          result[key] = value
        } else if (isArray(result[key])) {
          result[key].push(value)
        } else {
          result[key] = [ result[key], value ]
        }
      }
  )

  return result
}
},{"for-each":19,"trim":26}],24:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":25,"timers":24}],25:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],26:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],27:[function(require,module,exports){
"use strict";
var window = require("global/window")
var isFunction = require("is-function")
var parseHeaders = require("parse-headers")
var xtend = require("xtend")

module.exports = createXHR
createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
        options = initParams(uri, options, callback)
        options.method = method.toUpperCase()
        return _createXHR(options)
    }
})

function forEachArray(array, iterator) {
    for (var i = 0; i < array.length; i++) {
        iterator(array[i])
    }
}

function isEmpty(obj){
    for(var i in obj){
        if(obj.hasOwnProperty(i)) return false
    }
    return true
}

function initParams(uri, options, callback) {
    var params = uri

    if (isFunction(options)) {
        callback = options
        if (typeof uri === "string") {
            params = {uri:uri}
        }
    } else {
        params = xtend(options, {uri: uri})
    }

    params.callback = callback
    return params
}

function createXHR(uri, options, callback) {
    options = initParams(uri, options, callback)
    return _createXHR(options)
}

function _createXHR(options) {
    if(typeof options.callback === "undefined"){
        throw new Error("callback argument missing")
    }

    var called = false
    var callback = function cbOnce(err, response, body){
        if(!called){
            called = true
            options.callback(err, response, body)
        }
    }

    function readystatechange() {
        if (xhr.readyState === 4) {
            loadFunc()
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else {
            body = xhr.responseText || getXml(xhr)
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
        }
        evt.statusCode = 0
        return callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        if (aborted) return
        var status
        clearTimeout(timeoutTimer)
        if(options.useXDR && xhr.status===undefined) {
            //IE8 CORS GET successful response doesn't have a status field, but body is fine
            status = 200
        } else {
            status = (xhr.status === 1223 ? 204 : xhr.status)
        }
        var response = failureResponse
        var err = null

        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        return callback(err, response, response.body)
    }

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new createXHR.XDomainRequest()
        }else{
            xhr = new createXHR.XMLHttpRequest()
        }
    }

    var key
    var aborted
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer
    var failureResponse = {
        body: undefined,
        headers: {},
        statusCode: 0,
        method: method,
        url: uri,
        rawRequest: xhr
    }

    if ("json" in options && options.json !== false) {
        isJson = true
        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
            body = JSON.stringify(options.json === true ? body : options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.onabort = function(){
        aborted = true;
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync, options.username, options.password)
    //has to be after open
    if(!sync) {
        xhr.withCredentials = !!options.withCredentials
    }
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            if (aborted) return
            aborted = true//IE9 may still call readystatechange
            xhr.abort("timeout")
            var e = new Error("XMLHttpRequest timeout")
            e.code = "ETIMEDOUT"
            errorFunc(e)
        }, options.timeout )
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers && !isEmpty(options.headers)) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }

    if ("beforeSend" in options &&
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    // Microsoft Edge browser sends "undefined" when send is called with undefined value.
    // XMLHttpRequest spec says to pass null as body to indicate no body
    // See https://github.com/naugtur/xhr/issues/100.
    xhr.send(body || null)

    return xhr


}

function getXml(xhr) {
    if (xhr.responseType === "document") {
        return xhr.responseXML
    }
    var firefoxBugTakenEffect = xhr.status === 204 && xhr.responseXML && xhr.responseXML.documentElement.nodeName === "parsererror"
    if (xhr.responseType === "" && !firefoxBugTakenEffect) {
        return xhr.responseXML
    }

    return null
}

function noop() {}

},{"global/window":20,"is-function":22,"parse-headers":23,"xtend":28}],28:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],29:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lodash (Custom Build) lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 * Build: `lodash include="each,isArray,keys,isPlainObject,isFunction,isUndefined,clone,map,isString,isNumber,includes,extend,every"`
 */
;(function(){function t(t,n,r){switch(r.length){case 0:return t.call(n);case 1:return t.call(n,r[0]);case 2:return t.call(n,r[0],r[1]);case 3:return t.call(n,r[0],r[1],r[2])}return t.apply(n,r)}function n(t,n){for(var r=-1,e=null==t?0:t.length;++r<e&&n(t[r],r,t)!==false;);return t}function r(t,n){for(var r=-1,e=null==t?0:t.length;++r<e;)if(!n(t[r],r,t))return false;return true}function e(t,n){for(var r=-1,e=null==t?0:t.length,u=0,o=[];++r<e;){var i=t[r];n(i,r,t)&&(o[u++]=i)}return o}function u(t,n){for(var r=-1,e=null==t?0:t.length,u=Array(e);++r<e;)u[r]=n(t[r],r,t);
return u}function o(t,n){for(var r=-1,e=n.length,u=t.length;++r<e;)t[u+r]=n[r];return t}function i(t,n){for(var r=-1,e=null==t?0:t.length;++r<e;)if(n(t[r],r,t))return true;return false}function c(t,n,r,e){for(var u=t.length,o=r+(e?1:-1);e?o--:++o<u;)if(n(t[o],o,t))return o;return-1}function a(t,n,r){return n===n?d(t,n,r):c(t,f,r)}function f(t){return t!==t}function s(t){return function(n){return null==n?Gn:n[t]}}function l(t,n){for(var r=-1,e=Array(t);++r<t;)e[r]=n(r);return e}function h(t){return function(n){
return t(n)}}function p(t,n){return u(n,function(n){return t[n]})}function v(t,n){return t.has(n)}function y(t,n){return null==t?Gn:t[n]}function b(t){var n=-1,r=Array(t.size);return t.forEach(function(t,e){r[++n]=[e,t]}),r}function _(t,n){return function(r){return t(n(r))}}function g(t){var n=-1,r=Array(t.size);return t.forEach(function(t){r[++n]=t}),r}function d(t,n,r){for(var e=r-1,u=t.length;++e<u;)if(t[e]===n)return e;return-1}function j(){}function w(t){var n=-1,r=null==t?0:t.length;for(this.clear();++n<r;){
var e=t[n];this.set(e[0],e[1])}}function O(){this.__data__=Re?Re(null):{},this.size=0}function m(t){var n=this.has(t)&&delete this.__data__[t];return this.size-=n?1:0,n}function A(t){var n=this.__data__;if(Re){var r=n[t];return r===Qn?Gn:r}return _e.call(n,t)?n[t]:Gn}function z(t){var n=this.__data__;return Re?n[t]!==Gn:_e.call(n,t)}function x(t,n){var r=this.__data__;return this.size+=this.has(t)?0:1,r[t]=Re&&n===Gn?Qn:n,this}function S(t){var n=-1,r=null==t?0:t.length;for(this.clear();++n<r;){var e=t[n];
this.set(e[0],e[1])}}function k(){this.__data__=[],this.size=0}function $(t){var n=this.__data__,r=Q(n,t);return!(r<0)&&(r==n.length-1?n.pop():$e.call(n,r,1),--this.size,true)}function E(t){var n=this.__data__,r=Q(n,t);return r<0?Gn:n[r][1]}function I(t){return Q(this.__data__,t)>-1}function F(t,n){var r=this.__data__,e=Q(r,t);return e<0?(++this.size,r.push([t,n])):r[e][1]=n,this}function L(t){var n=-1,r=null==t?0:t.length;for(this.clear();++n<r;){var e=t[n];this.set(e[0],e[1])}}function P(){this.size=0,
this.__data__={hash:new w,map:new(Te||S),string:new w}}function U(t){var n=Wt(this,t).delete(t);return this.size-=n?1:0,n}function M(t){return Wt(this,t).get(t)}function N(t){return Wt(this,t).has(t)}function T(t,n){var r=Wt(this,t),e=r.size;return r.set(t,n),this.size+=r.size==e?0:1,this}function B(t){var n=-1,r=null==t?0:t.length;for(this.__data__=new L;++n<r;)this.add(t[n])}function C(t){return this.__data__.set(t,Qn),this}function D(t){return this.__data__.has(t)}function R(t){this.size=(this.__data__=new S(t)).size;
}function V(){this.__data__=new S,this.size=0}function W(t){var n=this.__data__,r=n.delete(t);return this.size=n.size,r}function q(t){return this.__data__.get(t)}function G(t){return this.__data__.has(t)}function H(t,n){var r=this.__data__;if(r instanceof S){var e=r.__data__;if(!Te||e.length<Jn-1)return e.push([t,n]),this.size=++r.size,this;r=this.__data__=new L(e)}return r.set(t,n),this.size=r.size,this}function J(t,n){var r=cu(t),e=!r&&iu(t),u=!r&&!e&&au(t),o=!r&&!e&&!u&&lu(t),i=r||e||u||o,c=i?l(t.length,String):[],a=c.length;
for(var f in t)!n&&!_e.call(t,f)||i&&("length"==f||u&&("offset"==f||"parent"==f)||o&&("buffer"==f||"byteLength"==f||"byteOffset"==f)||Yt(f,a))||c.push(f);return c}function K(t,n,r){var e=t[n];_e.call(t,n)&&jn(e,r)&&(r!==Gn||n in t)||Z(t,n,r)}function Q(t,n){for(var r=t.length;r--;)if(jn(t[r][0],n))return r;return-1}function X(t,n){return t&&Ft(n,Nn(n),t)}function Y(t,n){return t&&Ft(n,Tn(n),t)}function Z(t,n,r){"__proto__"==n&&Ie?Ie(t,n,{configurable:true,enumerable:true,value:r,writable:true}):t[n]=r}
function tt(t,r,e,u,o,i){var c,a=r&Yn,f=r&Zn,s=r&tr;if(e&&(c=o?e(t,u,o,i):e(t)),c!==Gn)return c;if(!An(t))return t;var l=cu(t);if(l){if(c=Kt(t),!a)return It(t,c)}else{var h=eu(t),p=h==yr||h==br;if(au(t))return zt(t,a);if(h==jr||h==fr||p&&!o){if(c=f||p?{}:Qt(t),!a)return f?Pt(t,Y(c,t)):Lt(t,X(c,t))}else{if(!Zr[h])return o?t:{};c=Xt(t,h,a)}}i||(i=new R);var v=i.get(t);if(v)return v;if(i.set(t,c),su(t))return t.forEach(function(n){c.add(tt(n,r,e,n,t,i))}),c;if(fu(t))return t.forEach(function(n,u){c.set(u,tt(n,r,e,u,t,i));
}),c;var y=s?f?Rt:Dt:f?Tn:Nn,b=l?Gn:y(t);return n(b||t,function(n,u){b&&(u=n,n=t[u]),K(c,u,tt(n,r,e,u,t,i))}),c}function nt(t,n){var r=true;return Ye(t,function(t,e,u){return r=!!n(t,e,u)}),r}function rt(t,n){return t&&Ze(t,n,Nn)}function et(t,n){n=At(n,t);for(var r=0,e=n.length;null!=t&&r<e;)t=t[hn(n[r++])];return r&&r==e?t:Gn}function ut(t,n,r){var e=n(t);return cu(t)?e:o(e,r(t))}function ot(t){return null==t?t===Gn?Sr:dr:Ee&&Ee in Object(t)?Ht(t):fn(t)}function it(t,n){return null!=t&&n in Object(t);
}function ct(t){return zn(t)&&ot(t)==fr}function at(t,n,r,e,u){return t===n||(null==t||null==n||!zn(t)&&!zn(n)?t!==t&&n!==n:ft(t,n,r,e,at,u))}function ft(t,n,r,e,u,o){var i=cu(t),c=cu(n),a=i?sr:eu(t),f=c?sr:eu(n);a=a==fr?jr:a,f=f==fr?jr:f;var s=a==jr,l=f==jr,h=a==f;if(h&&au(t)){if(!au(n))return false;i=true,s=false}if(h&&!s)return o||(o=new R),i||lu(t)?Tt(t,n,r,e,u,o):Bt(t,n,a,r,e,u,o);if(!(r&nr)){var p=s&&_e.call(t,"__wrapped__"),v=l&&_e.call(n,"__wrapped__");if(p||v){var y=p?t.value():t,b=v?n.value():n;return o||(o=new R),
u(y,b,r,e,o)}}return!!h&&(o||(o=new R),Ct(t,n,r,e,u,o))}function st(t){return zn(t)&&eu(t)==_r}function lt(t,n,r,e){var u=r.length,o=u,i=!e;if(null==t)return!o;for(t=Object(t);u--;){var c=r[u];if(i&&c[2]?c[1]!==t[c[0]]:!(c[0]in t))return false}for(;++u<o;){c=r[u];var a=c[0],f=t[a],s=c[1];if(i&&c[2]){if(f===Gn&&!(a in t))return false}else{var l=new R;if(e)var h=e(f,s,a,t,n,l);if(!(h===Gn?at(s,f,nr|rr,e,l):h))return false}}return true}function ht(t){return!(!An(t)||rn(t))&&(On(t)?we:Kr).test(pn(t))}function pt(t){
return zn(t)&&eu(t)==Ar}function vt(t){return zn(t)&&mn(t.length)&&!!Yr[ot(t)]}function yt(t){return typeof t=="function"?t:null==t?Dn:typeof t=="object"?cu(t)?jt(t[0],t[1]):dt(t):Vn(t)}function bt(t){if(!en(t))return Pe(t);var n=[];for(var r in Object(t))_e.call(t,r)&&"constructor"!=r&&n.push(r);return n}function _t(t){if(!An(t))return an(t);var n=en(t),r=[];for(var e in t)("constructor"!=e||!n&&_e.call(t,e))&&r.push(e);return r}function gt(t,n){var r=-1,e=wn(t)?Array(t.length):[];return Ye(t,function(t,u,o){
e[++r]=n(t,u,o)}),e}function dt(t){var n=qt(t);return 1==n.length&&n[0][2]?on(n[0][0],n[0][1]):function(r){return r===t||lt(r,t,n)}}function jt(t,n){return tn(t)&&un(n)?on(hn(t),n):function(r){var e=Un(r,t);return e===Gn&&e===n?Mn(r,t):at(n,e,nr|rr)}}function wt(t){return function(n){return et(n,t)}}function Ot(t,n){return uu(sn(t,n,Dn),t+"")}function mt(t){if(typeof t=="string")return t;if(cu(t))return u(t,mt)+"";if($n(t))return Qe?Qe.call(t):"";var n=t+"";return"0"==n&&1/t==-or?"-0":n}function At(t,n){
return cu(t)?t:tn(t,n)?[t]:ou(Pn(t))}function zt(t,n){if(n)return t.slice();var r=t.length,e=ze?ze(r):new t.constructor(r);return t.copy(e),e}function xt(t){var n=new t.constructor(t.byteLength);return new Ae(n).set(new Ae(t)),n}function St(t,n){return new t.constructor(n?xt(t.buffer):t.buffer,t.byteOffset,t.byteLength)}function kt(t){var n=new t.constructor(t.source,Gr.exec(t));return n.lastIndex=t.lastIndex,n}function $t(t){return Ke?Object(Ke.call(t)):{}}function Et(t,n){return new t.constructor(n?xt(t.buffer):t.buffer,t.byteOffset,t.length);
}function It(t,n){var r=-1,e=t.length;for(n||(n=Array(e));++r<e;)n[r]=t[r];return n}function Ft(t,n,r,e){var u=!r;r||(r={});for(var o=-1,i=n.length;++o<i;){var c=n[o],a=e?e(r[c],t[c],c,r,t):Gn;a===Gn&&(a=t[c]),u?Z(r,c,a):K(r,c,a)}return r}function Lt(t,n){return Ft(t,nu(t),n)}function Pt(t,n){return Ft(t,ru(t),n)}function Ut(t){return Ot(function(n,r){var e=-1,u=r.length,o=u>1?r[u-1]:Gn,i=u>2?r[2]:Gn;for(o=t.length>3&&typeof o=="function"?(u--,o):Gn,i&&Zt(r[0],r[1],i)&&(o=u<3?Gn:o,u=1),n=Object(n);++e<u;){
var c=r[e];c&&t(n,c,e,o)}return n})}function Mt(t,n){return function(r,e){if(null==r)return r;if(!wn(r))return t(r,e);for(var u=r.length,o=n?u:-1,i=Object(r);(n?o--:++o<u)&&e(i[o],o,i)!==false;);return r}}function Nt(t){return function(n,r,e){for(var u=-1,o=Object(n),i=e(n),c=i.length;c--;){var a=i[t?c:++u];if(r(o[a],a,o)===false)break}return n}}function Tt(t,n,r,e,u,o){var c=r&nr,a=t.length,f=n.length;if(a!=f&&!(c&&f>a))return false;var s=o.get(t);if(s&&o.get(n))return s==n;var l=-1,h=true,p=r&rr?new B:Gn;for(o.set(t,n),
o.set(n,t);++l<a;){var y=t[l],b=n[l];if(e)var _=c?e(b,y,l,n,t,o):e(y,b,l,t,n,o);if(_!==Gn){if(_)continue;h=false;break}if(p){if(!i(n,function(t,n){if(!v(p,n)&&(y===t||u(y,t,r,e,o)))return p.push(n)})){h=false;break}}else if(y!==b&&!u(y,b,r,e,o)){h=false;break}}return o.delete(t),o.delete(n),h}function Bt(t,n,r,e,u,o,i){switch(r){case Er:if(t.byteLength!=n.byteLength||t.byteOffset!=n.byteOffset)return false;t=t.buffer,n=n.buffer;case $r:return!(t.byteLength!=n.byteLength||!o(new Ae(t),new Ae(n)));case hr:case pr:
case gr:return jn(+t,+n);case vr:return t.name==n.name&&t.message==n.message;case mr:case zr:return t==n+"";case _r:var c=b;case Ar:var a=e&nr;if(c||(c=g),t.size!=n.size&&!a)return false;var f=i.get(t);if(f)return f==n;e|=rr,i.set(t,n);var s=Tt(c(t),c(n),e,u,o,i);return i.delete(t),s;case xr:if(Ke)return Ke.call(t)==Ke.call(n)}return false}function Ct(t,n,r,e,u,o){var i=r&nr,c=Dt(t),a=c.length;if(a!=Dt(n).length&&!i)return false;for(var f=a;f--;){var s=c[f];if(!(i?s in n:_e.call(n,s)))return false}var l=o.get(t);
if(l&&o.get(n))return l==n;var h=true;o.set(t,n),o.set(n,t);for(var p=i;++f<a;){s=c[f];var v=t[s],y=n[s];if(e)var b=i?e(y,v,s,n,t,o):e(v,y,s,t,n,o);if(!(b===Gn?v===y||u(v,y,r,e,o):b)){h=false;break}p||(p="constructor"==s)}if(h&&!p){var _=t.constructor,g=n.constructor;_!=g&&"constructor"in t&&"constructor"in n&&!(typeof _=="function"&&_ instanceof _&&typeof g=="function"&&g instanceof g)&&(h=false)}return o.delete(t),o.delete(n),h}function Dt(t){return ut(t,Nn,nu)}function Rt(t){return ut(t,Tn,ru)}function Vt(){
var t=j.iteratee||Rn;return t=t===Rn?yt:t,arguments.length?t(arguments[0],arguments[1]):t}function Wt(t,n){var r=t.__data__;return nn(n)?r[typeof n=="string"?"string":"hash"]:r.map}function qt(t){for(var n=Nn(t),r=n.length;r--;){var e=n[r],u=t[e];n[r]=[e,u,un(u)]}return n}function Gt(t,n){var r=y(t,n);return ht(r)?r:Gn}function Ht(t){var n=_e.call(t,Ee),r=t[Ee];try{t[Ee]=Gn;var e=true}catch(t){}var u=de.call(t);return e&&(n?t[Ee]=r:delete t[Ee]),u}function Jt(t,n,r){n=At(n,t);for(var e=-1,u=n.length,o=false;++e<u;){
var i=hn(n[e]);if(!(o=null!=t&&r(t,i)))break;t=t[i]}return o||++e!=u?o:(u=null==t?0:t.length,!!u&&mn(u)&&Yt(i,u)&&(cu(t)||iu(t)))}function Kt(t){var n=t.length,r=new t.constructor(n);return n&&"string"==typeof t[0]&&_e.call(t,"index")&&(r.index=t.index,r.input=t.input),r}function Qt(t){return typeof t.constructor!="function"||en(t)?{}:Xe(xe(t))}function Xt(t,n,r){var e=t.constructor;switch(n){case $r:return xt(t);case hr:case pr:return new e(+t);case Er:return St(t,r);case Ir:case Fr:case Lr:case Pr:
case Ur:case Mr:case Nr:case Tr:case Br:return Et(t,r);case _r:return new e;case gr:case zr:return new e(t);case mr:return kt(t);case Ar:return new e;case xr:return $t(t)}}function Yt(t,n){var r=typeof t;return n=null==n?ir:n,!!n&&("number"==r||"symbol"!=r&&Xr.test(t))&&t>-1&&t%1==0&&t<n}function Zt(t,n,r){if(!An(r))return false;var e=typeof n;return!!("number"==e?wn(r)&&Yt(n,r.length):"string"==e&&n in r)&&jn(r[n],t)}function tn(t,n){if(cu(t))return false;var r=typeof t;return!("number"!=r&&"symbol"!=r&&"boolean"!=r&&null!=t&&!$n(t))||(Dr.test(t)||!Cr.test(t)||null!=n&&t in Object(n));
}function nn(t){var n=typeof t;return"string"==n||"number"==n||"symbol"==n||"boolean"==n?"__proto__"!==t:null===t}function rn(t){return!!ge&&ge in t}function en(t){var n=t&&t.constructor;return t===(typeof n=="function"&&n.prototype||ve)}function un(t){return t===t&&!An(t)}function on(t,n){return function(r){return null!=r&&(r[t]===n&&(n!==Gn||t in Object(r)))}}function cn(t){var n=gn(t,function(t){return r.size===Xn&&r.clear(),t}),r=n.cache;return n}function an(t){var n=[];if(null!=t)for(var r in Object(t))n.push(r);
return n}function fn(t){return de.call(t)}function sn(n,r,e){return r=Ue(r===Gn?n.length-1:r,0),function(){for(var u=arguments,o=-1,i=Ue(u.length-r,0),c=Array(i);++o<i;)c[o]=u[r+o];o=-1;for(var a=Array(r+1);++o<r;)a[o]=u[o];return a[r]=e(c),t(n,this,a)}}function ln(t){var n=0,r=0;return function(){var e=Me(),u=ur-(e-r);if(r=e,u>0){if(++n>=er)return arguments[0]}else n=0;return t.apply(Gn,arguments)}}function hn(t){if(typeof t=="string"||$n(t))return t;var n=t+"";return"0"==n&&1/t==-or?"-0":n}function pn(t){
if(null!=t){try{return be.call(t)}catch(t){}try{return t+""}catch(t){}}return""}function vn(t,n,e){var u=cu(t)?r:nt;return e&&Zt(t,n,e)&&(n=Gn),u(t,Vt(n,3))}function yn(t,r){return(cu(t)?n:Ye)(t,Vt(r,3))}function bn(t,n,r,e){t=wn(t)?t:Bn(t),r=r&&!e?Fn(r):0;var u=t.length;return r<0&&(r=Ue(u+r,0)),kn(t)?r<=u&&t.indexOf(n,r)>-1:!!u&&a(t,n,r)>-1}function _n(t,n){return(cu(t)?u:gt)(t,Vt(n,3))}function gn(t,n){if(typeof t!="function"||null!=n&&typeof n!="function")throw new TypeError(Kn);var r=function(){
var e=arguments,u=n?n.apply(this,e):e[0],o=r.cache;if(o.has(u))return o.get(u);var i=t.apply(this,e);return r.cache=o.set(u,i)||o,i};return r.cache=new(gn.Cache||L),r}function dn(t){return tt(t,tr)}function jn(t,n){return t===n||t!==t&&n!==n}function wn(t){return null!=t&&mn(t.length)&&!On(t)}function On(t){if(!An(t))return false;var n=ot(t);return n==yr||n==br||n==lr||n==Or}function mn(t){return typeof t=="number"&&t>-1&&t%1==0&&t<=ir}function An(t){var n=typeof t;return null!=t&&("object"==n||"function"==n);
}function zn(t){return null!=t&&typeof t=="object"}function xn(t){return typeof t=="number"||zn(t)&&ot(t)==gr}function Sn(t){if(!zn(t)||ot(t)!=jr)return false;var n=xe(t);if(null===n)return true;var r=_e.call(n,"constructor")&&n.constructor;return typeof r=="function"&&r instanceof r&&be.call(r)==je}function kn(t){return typeof t=="string"||!cu(t)&&zn(t)&&ot(t)==zr}function $n(t){return typeof t=="symbol"||zn(t)&&ot(t)==xr}function En(t){return t===Gn}function In(t){if(!t)return 0===t?t:0;if(t=Ln(t),t===or||t===-or){
return(t<0?-1:1)*cr}return t===t?t:0}function Fn(t){var n=In(t),r=n%1;return n===n?r?n-r:n:0}function Ln(t){if(typeof t=="number")return t;if($n(t))return ar;if(An(t)){var n=typeof t.valueOf=="function"?t.valueOf():t;t=An(n)?n+"":n}if(typeof t!="string")return 0===t?t:+t;t=t.replace(Wr,"");var r=Jr.test(t);return r||Qr.test(t)?te(t.slice(2),r?2:8):Hr.test(t)?ar:+t}function Pn(t){return null==t?"":mt(t)}function Un(t,n,r){var e=null==t?Gn:et(t,n);return e===Gn?r:e}function Mn(t,n){return null!=t&&Jt(t,n,it);
}function Nn(t){return wn(t)?J(t):bt(t)}function Tn(t){return wn(t)?J(t,true):_t(t)}function Bn(t){return null==t?[]:p(t,Nn(t))}function Cn(t){return function(){return t}}function Dn(t){return t}function Rn(t){return yt(typeof t=="function"?t:tt(t,Yn))}function Vn(t){return tn(t)?s(hn(t)):wt(t)}function Wn(){return[]}function qn(){return false}var Gn,Hn="4.17.5",Jn=200,Kn="Expected a function",Qn="__lodash_hash_undefined__",Xn=500,Yn=1,Zn=2,tr=4,nr=1,rr=2,er=800,ur=16,or=1/0,ir=9007199254740991,cr=1.7976931348623157e308,ar=NaN,fr="[object Arguments]",sr="[object Array]",lr="[object AsyncFunction]",hr="[object Boolean]",pr="[object Date]",vr="[object Error]",yr="[object Function]",br="[object GeneratorFunction]",_r="[object Map]",gr="[object Number]",dr="[object Null]",jr="[object Object]",wr="[object Promise]",Or="[object Proxy]",mr="[object RegExp]",Ar="[object Set]",zr="[object String]",xr="[object Symbol]",Sr="[object Undefined]",kr="[object WeakMap]",$r="[object ArrayBuffer]",Er="[object DataView]",Ir="[object Float32Array]",Fr="[object Float64Array]",Lr="[object Int8Array]",Pr="[object Int16Array]",Ur="[object Int32Array]",Mr="[object Uint8Array]",Nr="[object Uint8ClampedArray]",Tr="[object Uint16Array]",Br="[object Uint32Array]",Cr=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,Dr=/^\w*$/,Rr=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,Vr=/[\\^$.*+?()[\]{}|]/g,Wr=/^\s+|\s+$/g,qr=/\\(\\)?/g,Gr=/\w*$/,Hr=/^[-+]0x[0-9a-f]+$/i,Jr=/^0b[01]+$/i,Kr=/^\[object .+?Constructor\]$/,Qr=/^0o[0-7]+$/i,Xr=/^(?:0|[1-9]\d*)$/,Yr={};
Yr[Ir]=Yr[Fr]=Yr[Lr]=Yr[Pr]=Yr[Ur]=Yr[Mr]=Yr[Nr]=Yr[Tr]=Yr[Br]=true,Yr[fr]=Yr[sr]=Yr[$r]=Yr[hr]=Yr[Er]=Yr[pr]=Yr[vr]=Yr[yr]=Yr[_r]=Yr[gr]=Yr[jr]=Yr[mr]=Yr[Ar]=Yr[zr]=Yr[kr]=false;var Zr={};Zr[fr]=Zr[sr]=Zr[$r]=Zr[Er]=Zr[hr]=Zr[pr]=Zr[Ir]=Zr[Fr]=Zr[Lr]=Zr[Pr]=Zr[Ur]=Zr[_r]=Zr[gr]=Zr[jr]=Zr[mr]=Zr[Ar]=Zr[zr]=Zr[xr]=Zr[Mr]=Zr[Nr]=Zr[Tr]=Zr[Br]=true,Zr[vr]=Zr[yr]=Zr[kr]=false;var te=parseInt,ne=typeof global=="object"&&global&&global.Object===Object&&global,re=typeof self=="object"&&self&&self.Object===Object&&self,ee=ne||re||Function("return this")(),ue=typeof exports=="object"&&exports&&!exports.nodeType&&exports,oe=ue&&typeof module=="object"&&module&&!module.nodeType&&module,ie=oe&&oe.exports===ue,ce=ie&&ne.process,ae=function(){
try{return ce&&ce.binding&&ce.binding("util")}catch(t){}}(),fe=ae&&ae.isMap,se=ae&&ae.isSet,le=ae&&ae.isTypedArray,he=Array.prototype,pe=Function.prototype,ve=Object.prototype,ye=ee["__core-js_shared__"],be=pe.toString,_e=ve.hasOwnProperty,ge=function(){var t=/[^.]+$/.exec(ye&&ye.keys&&ye.keys.IE_PROTO||"");return t?"Symbol(src)_1."+t:""}(),de=ve.toString,je=be.call(Object),we=RegExp("^"+be.call(_e).replace(Vr,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),Oe=ie?ee.Buffer:Gn,me=ee.Symbol,Ae=ee.Uint8Array,ze=Oe?Oe.allocUnsafe:Gn,xe=_(Object.getPrototypeOf,Object),Se=Object.create,ke=ve.propertyIsEnumerable,$e=he.splice,Ee=me?me.toStringTag:Gn,Ie=function(){
try{var t=Gt(Object,"defineProperty");return t({},"",{}),t}catch(t){}}(),Fe=Object.getOwnPropertySymbols,Le=Oe?Oe.isBuffer:Gn,Pe=_(Object.keys,Object),Ue=Math.max,Me=Date.now,Ne=Gt(ee,"DataView"),Te=Gt(ee,"Map"),Be=Gt(ee,"Promise"),Ce=Gt(ee,"Set"),De=Gt(ee,"WeakMap"),Re=Gt(Object,"create"),Ve=pn(Ne),We=pn(Te),qe=pn(Be),Ge=pn(Ce),He=pn(De),Je=me?me.prototype:Gn,Ke=Je?Je.valueOf:Gn,Qe=Je?Je.toString:Gn,Xe=function(){function t(){}return function(n){if(!An(n))return{};if(Se)return Se(n);t.prototype=n;
var r=new t;return t.prototype=Gn,r}}();w.prototype.clear=O,w.prototype.delete=m,w.prototype.get=A,w.prototype.has=z,w.prototype.set=x,S.prototype.clear=k,S.prototype.delete=$,S.prototype.get=E,S.prototype.has=I,S.prototype.set=F,L.prototype.clear=P,L.prototype.delete=U,L.prototype.get=M,L.prototype.has=N,L.prototype.set=T,B.prototype.add=B.prototype.push=C,B.prototype.has=D,R.prototype.clear=V,R.prototype.delete=W,R.prototype.get=q,R.prototype.has=G,R.prototype.set=H;var Ye=Mt(rt),Ze=Nt(),tu=Ie?function(t,n){
return Ie(t,"toString",{configurable:true,enumerable:false,value:Cn(n),writable:true})}:Dn,nu=Fe?function(t){return null==t?[]:(t=Object(t),e(Fe(t),function(n){return ke.call(t,n)}))}:Wn,ru=Fe?function(t){for(var n=[];t;)o(n,nu(t)),t=xe(t);return n}:Wn,eu=ot;(Ne&&eu(new Ne(new ArrayBuffer(1)))!=Er||Te&&eu(new Te)!=_r||Be&&eu(Be.resolve())!=wr||Ce&&eu(new Ce)!=Ar||De&&eu(new De)!=kr)&&(eu=function(t){var n=ot(t),r=n==jr?t.constructor:Gn,e=r?pn(r):"";if(e)switch(e){case Ve:return Er;case We:return _r;case qe:
return wr;case Ge:return Ar;case He:return kr}return n});var uu=ln(tu),ou=cn(function(t){var n=[];return 46===t.charCodeAt(0)&&n.push(""),t.replace(Rr,function(t,r,e,u){n.push(e?u.replace(qr,"$1"):r||t)}),n});gn.Cache=L;var iu=ct(function(){return arguments}())?ct:function(t){return zn(t)&&_e.call(t,"callee")&&!ke.call(t,"callee")},cu=Array.isArray,au=Le||qn,fu=fe?h(fe):st,su=se?h(se):pt,lu=le?h(le):vt,hu=Ut(function(t,n){Ft(n,Tn(n),t)});j.assignIn=hu,j.constant=Cn,j.iteratee=Rn,j.keys=Nn,j.keysIn=Tn,
j.map=_n,j.memoize=gn,j.property=Vn,j.values=Bn,j.extend=hu,j.clone=dn,j.eq=jn,j.every=vn,j.forEach=yn,j.get=Un,j.hasIn=Mn,j.identity=Dn,j.includes=bn,j.isArguments=iu,j.isArray=cu,j.isArrayLike=wn,j.isBuffer=au,j.isFunction=On,j.isLength=mn,j.isMap=fu,j.isNumber=xn,j.isObject=An,j.isObjectLike=zn,j.isPlainObject=Sn,j.isSet=su,j.isString=kn,j.isSymbol=$n,j.isTypedArray=lu,j.isUndefined=En,j.stubArray=Wn,j.stubFalse=qn,j.toFinite=In,j.toInteger=Fn,j.toNumber=Ln,j.toString=Pn,j.each=yn,j.VERSION=Hn,
typeof define=="function"&&typeof define.amd=="object"&&define.amd?(ee._=j, define(function(){return j})):oe?((oe.exports=j)._=j,ue._=j):ee._=j}).call(this);
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"airtable":[function(require,module,exports){
'use strict';

var assert = require('assert');

var Class = require('./class');
var Base = require('./base');
var Record = require('./record');
var Table = require('./table');
var AirtableError = require('./airtable_error');

var Airtable = Class.extend({
    init: function(opts) {
        opts = opts || {};

        var default_config = Airtable.default_config();

        this._apiKey = opts.apiKey || Airtable.apiKey || default_config.apiKey;
        this._endpointUrl = opts.endpointUrl || Airtable.endpointUrl || default_config.endpointUrl;
        this._apiVersion = opts.apiVersion || Airtable.apiVersion || default_config.apiVersion;
        this._apiVersionMajor = this._apiVersion.split('.')[0];
        this._allowUnauthorizedSsl = opts.allowUnauthorizedSsl || Airtable.allowUnauthorizedSsl || default_config.allowUnauthorizedSsl;
        this._noRetryIfRateLimited = opts.noRetryIfRateLimited || Airtable.noRetryIfRateLimited || default_config.noRetryIfRateLimited;
        this.requestTimeout = opts.requestTimeout || default_config.requestTimeout;

        assert(this._apiKey, 'API key is required to connect to Airtable');
    },

    base: function(baseId) {
        return Base.createFunctor(this, baseId);
    }
});

Airtable.default_config = function () {
    return {
        endpointUrl: undefined || 'https://api.airtable.com',
        apiVersion: '0.1.0',
        apiKey: undefined,
        allowUnauthorizedSsl: false,
        noRetryIfRateLimited: false,
        requestTimeout: 300 * 1000, // 5 minutes
    };
};

Airtable.configure = function(opts) {
    Airtable.apiKey = opts.apiKey;
    Airtable.endpointUrl = opts.endpointUrl;
    Airtable.apiVersion = opts.apiVersion;
    Airtable.allowUnauthorizedSsl = opts.allowUnauthorizedSsl;
    Airtable.noRetryIfRateLimited = opts.noRetryIfRateLimited;
};

Airtable.base = function(baseId) {
    return new Airtable().base(baseId);
};

Airtable.Base = Base;
Airtable.Record = Record;
Airtable.Table = Table;
Airtable.Error = AirtableError;

module.exports = Airtable;

},{"./airtable_error":1,"./base":2,"./class":4,"./record":9,"./table":11,"assert":13}]},{},["airtable"]);
