'use strict';

var Airtable = require('../lib/airtable');
var express = require('express');
var bodyParser = require('body-parser');
var getPort = require('get-port');
var util = require('util');

describe('record deletion', function () {
  var airtable;
  var testServer;
  var testServerPort;

  beforeAll(function () {
    var app = express();

    app.use(bodyParser.json());

    function checkParamsMiddleware(req, res, next) {
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

    app.delete('/v0/:baseId/:tableIdOrName/:recordId', checkParamsMiddleware, function (req, res, next) {
      res.json({
        id: req.params.recordId,
        deleted: true
      });
    });

    app.delete('/v0/:baseId/:tableIdOrName', checkParamsMiddleware, function (req, res, next) {
      res.json({
        records: req.query.records.map(function (recordId) {
          return {
            id: recordId,
            deleted: true
          };
        })
      });
    });

    return getPort().then(function (port) {
      testServerPort = port;

      airtable = new Airtable({
        apiKey: 'key123',
        endpointUrl: 'http://localhost:' + testServerPort
      });

      return new Promise(function (resolve, reject) {
        testServer = app.listen(testServerPort, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });

  afterAll(function () {
    return util.promisify(testServer.close.bind(testServer))();
  });

  it('can delete one record', function () {
    return airtable
      .base('app123')
      .table('Table')
      .destroy('rec123')
      .then(function (deletedRecord) {
        expect(deletedRecord.id).toBe('rec123');
      });
  });

  it('can delete multiple records', function () {
    return airtable
      .base('app123')
      .table('Table')
      .destroy(['rec123', 'rec456'])
      .then(function (deletedRecords) {
        expect(deletedRecords).toHaveLength(2);
        expect(deletedRecords[0].id).toBe('rec123');
        expect(deletedRecords[1].id).toBe('rec456');
      });
  });
});
