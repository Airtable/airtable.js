'use strict';

var Airtable = require('../lib/airtable');
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var getPort = require('get-port');
var util = require('util');
var URLSearchParams = require('url').URLSearchParams;

var FAKE_CREATED_TIME = '2020-04-20T16:20:00.000Z';

function getMockEnvironmentAsync(options) {
    options = options || {};

    var app = express();

    app.set('case sensitive routing', true);
    app.set('query parser', string => new URLSearchParams(string));

    app.use(bodyParser.json());

    app.use(function(req, res, next) {
        req.app.set('most recent request', req);
        next();
    });

    app.use(function(req, res, next) {
        const handlerOverride = req.app.get('handler override');
        if (handlerOverride) {
            handlerOverride(req, res, next);
        } else {
            next();
        }
    });

    app.post('/v0/:baseId/:tableIdOrName', _checkParamsMiddleware, function(req, res) {
        var isCreatingJustOneRecord = !!req.body.fields;
        var recordsInBody = isCreatingJustOneRecord ? [req.body] : req.body.records;

        var records = recordsInBody.map(function(record, index) {
            var fields = req.body.typecast ? {typecasted: true} : record.fields;
            return {
                id: 'rec' + index,
                createdTime: FAKE_CREATED_TIME,
                fields: fields,
            };
        });

        var responseBody = isCreatingJustOneRecord ? records[0] : {records: records};
        res.json(responseBody);
    });

    const singleRecordUpdate = [
        _checkParamsMiddleware,
        function(req, res) {
            var fields = req.body.typecast ? {typecasted: true} : req.body.fields;

            res.json({
                id: req.params.recordId,
                createdTime: FAKE_CREATED_TIME,
                fields: fields,
            });
        },
    ];
    const batchRecordUpdate = [
        _checkParamsMiddleware,
        function(req, res) {
            res.json({
                records: req.body.records.map(function(record) {
                    var fields = req.body.typecast ? {typecasted: true} : record.fields;
                    return {
                        id: record.id,
                        createdTime: FAKE_CREATED_TIME,
                        fields: fields,
                    };
                }),
            });
        },
    ];

    app.patch('/v0/:baseId/:tableIdOrName/:recordId', singleRecordUpdate);
    app.put('/v0/:baseId/:tableIdOrName/:recordId', singleRecordUpdate);

    app.patch('/v0/:baseId/:tableIdOrName', batchRecordUpdate);
    app.put('/v0/:baseId/:tableIdOrName', batchRecordUpdate);

    app.delete('/v0/:baseId/:tableIdOrName/:recordId', _checkParamsMiddleware, function(req, res) {
        res.json({
            id: req.params.recordId,
            deleted: true,
        });
    });

    app.delete('/v0/:baseId/:tableIdOrName', _checkParamsMiddleware, function(req, res) {
        res.json({
            records: req.query.getAll('records[]').map(function(recordId) {
                return {
                    id: recordId,
                    deleted: true,
                };
            }),
        });
    });

    app.use(function(req, res) {
        res.status(404);
        res.json({error: 'NOT_FOUND'});
    });

    // istanbul ignore next
    /* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
    app.use(function(err, req, res, next) {
        /* eslint-enable no-unused-vars, @typescript-eslint/no-unused-vars */
        console.error(err);
        res.status(500);
        res.json({
            error: {
                type: 'TEST_ERROR',
                message: err.message,
            },
        });
    });

    return getPort().then(function(testServerPort) {
        return new Promise(function(resolve, reject) {
            var testServer;

            if (options.https) {
                testServer = https.createServer(_getHttpsServerOptions(), app);
            } else {
                testServer = http.createServer(app);
            }

            testServer.listen(testServerPort, function(err) {
                // istanbul ignore if
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        airtable: new Airtable({
                            apiKey: 'key123',
                            endpointUrl: 'http://localhost:' + testServerPort,
                            requestTimeout: 1000, // Required for timeout tests
                        }),
                        teardownAsync: util.promisify(testServer.close.bind(testServer)),
                        testExpressApp: app,
                    });
                }
            });
        });
    });
}

function _checkParamsMiddleware(req, res, next) {
    var areParamsValid =
        req.get('authorization') === 'Bearer key123' &&
        req.params.baseId === 'app123' &&
        req.params.tableIdOrName === 'Table';
    // istanbul ignore else
    if (areParamsValid) {
        next();
    } else {
        next(new Error('Bad parameters'));
    }
}

var _cachedHttpsServerOptions;
function _getHttpsServerOptions() {
    if (!_cachedHttpsServerOptions) {
        _cachedHttpsServerOptions = {
            key: fs.readFileSync(path.join(__dirname, 'self_signed.key')),
            cert: fs.readFileSync(path.join(__dirname, 'self_signed.cert')),
        };
    }

    return _cachedHttpsServerOptions;
}

module.exports = {
    getMockEnvironmentAsync: getMockEnvironmentAsync,
};
