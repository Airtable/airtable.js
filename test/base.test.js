'use strict';

const request = require('request');
const { version } = require('../package.json');
const Airtable = require('../lib/airtable');
const Base = require('../lib/base');
const runAction = require('../lib/run_action');

jest.mock('request');


describe('Base', () => {
  describe('#runAction', () => {
    it('makes requests with the right options', () => {
      const fakeAirtable = new Airtable({
        apiKey: 'keyXyz',
        requestTimeout: 1234
      });
      const fakeBase = fakeAirtable.base('app123');

      fakeBase.runAction('get', '/my_table/rec456', {}, null, () => {});

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
          'User-Agent': 'Airtable.js'
        },
        agentOptions: {
          rejectUnauthorized: false
        }
      }, expect.any(Function));
    })
  })
})