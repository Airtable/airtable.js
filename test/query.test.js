'use strict';

var Query = require('../lib/query');

describe('Query', function() {
    it('throws an error with invalid parameter value', function() {
        return expect(() => {
            new Query('table', {maxRecords: '5'});
        }).toThrow(/Invalid parameter/);
    });

    it('throws an error with invalid parameter keys', function() {
        return expect(() => {
            new Query('table', {unknownKey: '5'});
        }).toThrow(/Invalid parameter/);
    });

    it('throws an error on validating invalid params', function() {
        return expect(() => {
            Query.validateParams('?param!=object');
        }).toThrow(/to be an object/);
    });

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
