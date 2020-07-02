'use strict';

var Airtable = require('../lib/airtable');

describe('Airtable', function() {
    it("doesn't include the API key as an enumerable property", function() {
        var fakeAirtable = new Airtable({apiKey: 'keyXyz'});

        Object.values(fakeAirtable).forEach(function(value) {
            expect(value).not.toEqual('keyXyz');
        });
    });

    it('recognizes API key as a property of the constructor', function() {
        try {
            Airtable.apiKey = 'keyAbc';
            new Airtable({});
            new Airtable();
        } finally {
            delete Airtable.apiKey;
        }
    });

    it('recognizes API key as an environment variable', function() {
        try {
            process.env.AIRTABLE_API_KEY = 'keyDef';
            new Airtable({});
            new Airtable();
        } finally {
            delete process.env.AIRTABLE_API_KEY;
        }
    });

    it('throws when API key is not provided', function() {
        expect(function() {
            new Airtable({});
        }).toThrow();

        expect(function() {
            new Airtable();
        }).toThrow();
    });

    describe('configure static method', function() {
        it('sets the apiKey', function() {
            Airtable.configure({apiKey: 'keyGhi'});

            try {
                expect(Airtable.apiKey).toEqual('keyGhi');
            } finally {
                delete Airtable.apiKey;
            }
        });
    });

    describe('base static method', function() {
        it('throws in the absense of an API key', function() {
            expect(function() {
                Airtable.base('abaseid');
            });
        });

        it('returns a Base function configured with the given base and access to tables', function() {
            try {
                Airtable.apiKey = 'keyJkl';
                var baseFn = Airtable.base('abaseid');

                expect(baseFn.getId()).toBe('abaseid');
                expect(baseFn('atablename').name).toBe('atablename');
                expect(baseFn('atablename').id).toBe(null);
            } finally {
                delete Airtable.apiKey;
            }
        });
    });

    describe('base instance method', function() {
        it('returns a Base instance configured with the given ID', function() {
            var base = new Airtable({apiKey: 'keyMno'}).base('anotherbaseid');

            expect(base.getId()).toBe('anotherbaseid');
        });
    });
});
