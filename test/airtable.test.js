'use strict';

var Airtable = require('../lib/airtable');

describe('Airtable', function () {
  it("doesn't include the API key as an enumerable property", function () {
    var fakeAirtable = new Airtable({apiKey: 'keyXyz'});

    Object.values(fakeAirtable).forEach(function (value) {
      expect(value).not.toEqual('keyXyz');
    });
  });
});
