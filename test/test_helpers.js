'use strict';

var Airtable = require('../lib/airtable');
var express = require('express');
var bodyParser = require('body-parser');
var getPort = require('get-port');
var util = require('util');

var FAKE_CREATED_TIME = '2020-04-20T16:20:00.000Z';

function getMockEnvironmentAsync() {
  var app = express();

  app.use(bodyParser.json());

  app.post('/v0/:baseId/:tableIdOrName', _checkParamsMiddleware, function (req, res) {
    var isCreatingJustOneRecord = !!req.body.fields;
    var recordsInBody = isCreatingJustOneRecord ? [req.body] : req.body.records;

    var records = recordsInBody.map(function (record, index) {
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
        records: req.body.records.map(function (record) {
          var fields = req.body.typecast ? {typecasted: true} : record.fields;
          return {
            id: record.id,
            createdTime: FAKE_CREATED_TIME,
            fields: fields
          };
        }),
      });
    },
  ];

  app.patch('/v0/:baseId/:tableIdOrName/:recordId', singleRecordUpdate);
  app.put('/v0/:baseId/:tableIdOrName/:recordId', singleRecordUpdate);

  app.patch('/v0/:baseId/:tableIdOrName', batchRecordUpdate);
  app.put('/v0/:baseId/:tableIdOrName', batchRecordUpdate);

  app.delete('/v0/:baseId/:tableIdOrName/:recordId', _checkParamsMiddleware, function (req, res) {
    res.json({
      id: req.params.recordId,
      deleted: true
    });
  });

  app.delete('/v0/:baseId/:tableIdOrName', _checkParamsMiddleware, function (req, res) {
    res.json({
      records: req.query.records.map(function (recordId) {
        return {
          id: recordId,
          deleted: true
        };
      })
    });
  });

  app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500);
    res.json({
      error: {
        type: 'TEST_ERROR',
        message: err.message,
      }
    });
  });

  return getPort().then(function (testServerPort) {
    return new Promise(function (resolve, reject) {
      var testServer = app.listen(testServerPort, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            airtable: new Airtable({
              apiKey: 'key123',
              endpointUrl: 'http://localhost:' + testServerPort,
            }),
            teardownAsync: util.promisify(testServer.close.bind(testServer)),
          });
        }
      });
    });
  });
}

function _checkParamsMiddleware(req, res, next) {
  var areParamsValid = (
    (req.get('authorization') === 'Bearer key123') &&
    (req.params.baseId === 'app123') &&
    (req.params.tableIdOrName === 'Table')
  );
  if (areParamsValid) {
    next();
  } else {
    next(new Error('Bad parameters'));
  }
}

module.exports = {
  getMockEnvironmentAsync: getMockEnvironmentAsync,
};
