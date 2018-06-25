'use strict';

var request = require('request');
var version = require('../package.json').version;
var Airtable = require('../lib/airtable');
var Base = require('../lib/base');
var runAction = require('../lib/run_action');

jest.mock('request');

describe('Base', function () {
  describe('#runAction', function () {
    it('makes requests with the right options', function () {
      var fakeAirtable = new Airtable({
        apiKey: 'keyXyz',
        requestTimeout: 1234
      });
      var fakeBase = fakeAirtable.base('app123');

      fakeBase.runAction('get', '/my_table/rec456', {}, null, function () {});

      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'https://api.airtable.com/v0/app123/my_table/rec456?',
        json: true,
        timeout: 1234,
        headers: {
          authorization: 'Bearer keyXyz',
          'x-api-version': '0.1.0',
          'x-airtable-application-id': 'app123',
          'User-Agent': 'Airtable.js/' + version
        },
        agentOptions: {
          rejectUnauthorized: false
        }
      }, expect.any(Function));

      expect(version).toEqual(expect.stringMatching(/^\d+\.\d+\.\d+$/));
    });
  });
});