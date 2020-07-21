import check from './typecheck';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isPlainObject from 'lodash/isPlainObject';
import includes from 'lodash/includes';

export const paramValidators = {
    fields: check(
        check.isArrayOf(isString),
        'the value for `fields` should be an array of strings'
    ),

    filterByFormula: check(isString, 'the value for `filterByFormula` should be a string'),

    maxRecords: check(isNumber, 'the value for `maxRecords` should be a number'),

    pageSize: check(isNumber, 'the value for `pageSize` should be a number'),

    offset: check(isNumber, 'the value for `offset` should be a number'),

    sort: check(
        check.isArrayOf((obj): obj is {field: string; direction?: 'asc' | 'desc'} => {
            return (
                isPlainObject(obj) &&
                isString(obj.field) &&
                (obj.direction === void 0 || includes(['asc', 'desc'], obj.direction))
            );
        }),
        'the value for `sort` should be an array of sort objects. ' +
            'Each sort object must have a string `field` value, and an optional ' +
            '`direction` value that is "asc" or "desc".'
    ),

    view: check(isString, 'the value for `view` should be a string'),

    cellFormat: check((cellFormat): cellFormat is 'json' | 'string' => {
        return isString(cellFormat) && includes(['json', 'string'], cellFormat);
    }, 'the value for `cellFormat` should be "json" or "string"'),

    timeZone: check(isString, 'the value for `timeZone` should be a string'),

    userLocale: check(isString, 'the value for `userLocale` should be a string'),
};

export type QueryParams = {
    [key in keyof typeof paramValidators]?: Parameters<typeof paramValidators[key]>[0];
};
