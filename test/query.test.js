'use strict';

var Query = require('../lib/query');

describe('Query', function() {
    it('validates cellFormat params', function() {
        var validParams = {cellFormat: 'json'};
        expect(Query.validateParams(validParams).validParams).toStrictEqual(validParams);
        validParams = {cellFormat: 'string'};
        expect(Query.validateParams(validParams).validParams).toStrictEqual(validParams);
        var invalidParams = {cellFormat: 'monkey'};
        expect(Query.validateParams(invalidParams).validParams).toStrictEqual({});
        expect(Query.validateParams(invalidParams).errors.length).toBe(1);
        expect(Query.validateParams(invalidParams).errors[0]).toMatch(/cellFormat/);
        invalidParams = {cellFormat: 5};
        expect(Query.validateParams(invalidParams).validParams).toStrictEqual({});
        expect(Query.validateParams(invalidParams).errors.length).toBe(1);
        expect(Query.validateParams(invalidParams).errors[0]).toMatch(/cellFormat/);
    });
});
