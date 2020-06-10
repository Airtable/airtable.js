'use strict';

var querystring = require('querystring');
var objectToQueryParamString = require('../lib/object_to_query_param_string');

describe('objectToQueryParamString', function() {
    it('returns the empty string for an empty object', function() {
        expect(objectToQueryParamString({})).toBe('');
    });

    it('serializes strings', function() {
        expect(objectToQueryParamString({foo: 'boo'})).toBe('foo=boo');
        expect(objectToQueryParamString({foo: 'bar baz'})).toBe('foo=bar+baz');

        expect(objectToQueryParamString({foo: ''})).toBe('foo=');
        expect(objectToQueryParamString({'': 'foo'})).toBe('=foo');

        expect(objectToQueryParamString({'🌴': 'foo'})).toBe('%F0%9F%8C%B4=foo');
        expect(objectToQueryParamString({foo: '🌴'})).toBe('foo=%F0%9F%8C%B4');
    });

    it('serializes numbers', function() {
        expect(objectToQueryParamString({n: 0})).toBe('n=0');
        expect(objectToQueryParamString({n: 1})).toBe('n=1');
        expect(objectToQueryParamString({n: 1.23})).toBe('n=1.23');
        expect(objectToQueryParamString({n: -456})).toBe('n=-456');

        expect(objectToQueryParamString({n: -0})).toBe('n=0');

        expect(objectToQueryParamString({n: Infinity})).toBe('n=Infinity');
        expect(objectToQueryParamString({n: NaN})).toBe('n=NaN');
    });

    it('serializes booleans', function() {
        expect(objectToQueryParamString({b: true})).toBe('b=true');
        expect(objectToQueryParamString({b: false})).toBe('b=false');
    });

    it('serializes null and undefined', function() {
        expect(objectToQueryParamString({x: null})).toBe('');
        expect(objectToQueryParamString({x: void 0})).toBe('x=');
    });

    it('serializes arrays', function() {
        expect(objectToQueryParamString({arr: [1]})).toBe(encodeURIComponent('arr[]') + '=1');
        expect(objectToQueryParamString({'arr[]': [1]})).toBe(encodeURIComponent('arr[]') + '=1');
        expect(objectToQueryParamString({arr: [1, 2]})).toBe(
            [
                encodeURIComponent('arr[]'),
                '=',
                '1',
                '&',
                encodeURIComponent('arr[]'),
                '=',
                '2',
            ].join('')
        );

        expect(objectToQueryParamString({arr: []})).toBe('');

        var actual = querystring.parse(
            objectToQueryParamString({
                arr: [{foo: 'boo'}, {foo: 'bar', baz: 'qux'}],
            })
        );
        var expected = {
            'arr[0][foo]': 'boo',
            'arr[1][foo]': 'bar',
            'arr[1][baz]': 'qux',
        };
        expect(actual).toEqual(expected);
    });

    it('serializes objects', function() {
        expect(objectToQueryParamString({obj: {foo: 'boo'}})).toBe(
            encodeURIComponent('obj[foo]') + '=boo'
        );

        expect(
            objectToQueryParamString({
                obj: {
                    foo: {
                        bar: 'baz',
                    },
                },
            })
        ).toBe(encodeURIComponent('obj[foo][bar]') + '=baz');

        expect(objectToQueryParamString({obj: {}})).toBe('');

        function Klass(prop) {
            this.instanceProperty = prop;
        }
        Klass.prototype.prototypeProperty = 'should be ignored';
        expect(
            objectToQueryParamString({
                obj: new Klass('foo'),
            })
        ).toBe(encodeURIComponent('obj[instanceProperty]') + '=foo');
    });
});
