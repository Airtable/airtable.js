'use strict';

var Airtable = require('../lib/airtable');
var express = require('express');
var bodyParser = require('body-parser');
var getPort = require('get-port');
var util = require('util');

function getMockEnvironmentAsync() {
  var app = express();

  app.use(bodyParser.json());

  app.delete('/v0/:baseId/:tableIdOrName/:recordId', _checkParamsMiddleware, function (req, res, next) {
    res.json({
      id: req.params.recordId,
      deleted: true
    });
  });

  app.delete('/v0/:baseId/:tableIdOrName', _checkParamsMiddleware, function (req, res, next) {
    res.json({
      records: req.query.records.map(function (recordId) {
        return {
          id: recordId,
          deleted: true
        };
      })
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
