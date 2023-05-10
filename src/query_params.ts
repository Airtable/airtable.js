import check from './typecheck';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isPlainObject from 'lodash/isPlainObject';
import isBoolean from 'lodash/isBoolean';

export const paramValidators = {
    fields: check(
        check.isArrayOf(isString),
        'the value for `fields` should be an array of strings'
    ),

    filterByFormula: check(isString, 'the value for `filterByFormula` should be a string'),

    maxRecords: check(isNumber, 'the value for `maxRecords` should be a number'),

    pageSize: check(isNumber, 'the value for `pageSize` should be a number'),

    offset: check(isString, 'the value for `offset` should be a string'),

    sort: check(
        check.isArrayOf((obj): obj is {field: string; direction?: 'asc' | 'desc'} => {
            return (
                isPlainObject(obj) &&
                isString(obj.field) &&
                (obj.direction === void 0 || ['asc', 'desc'].includes(obj.direction))
            );
        }),
        'the value for `sort` should be an array of sort objects. ' +
            'Each sort object must have a string `field` value, and an optional ' +
            '`direction` value that is "asc" or "desc".'
    ),

    view: check(isString, 'the value for `view` should be a string'),

    cellFormat: check((cellFormat): cellFormat is 'json' | 'string' => {
        return isString(cellFormat) && ['json', 'string'].includes(cellFormat);
    }, 'the value for `cellFormat` should be "json" or "string"'),

    timeZone: check(isString, 'the value for `timeZone` should be a string'),

    userLocale: check(isString, 'the value for `userLocale` should be a string'),

    method: check((method): method is 'json' | 'string' => {
        return isString(method) && ['get', 'post'].includes(method);
    }, 'the value for `method` should be "get" or "post"'),

    returnFieldsByFieldId: check(
        isBoolean,
        'the value for `returnFieldsByFieldId` should be a boolean'
    ),
};

export const URL_CHARACTER_LENGTH_LIMIT = 15000;

export const shouldListRecordsParamBePassedAsParameter = (paramName: string): boolean => {
    return paramName === 'timeZone' || paramName === 'userLocale';
};

export interface SortParameter<TFields> {
    field: keyof TFields;
    direction?: 'asc' | 'desc';
}

export interface QueryParams<TFields> {
    fields?: (keyof TFields)[];
    filterByFormula?: string;
    maxRecords?: number;
    pageSize?: number;
    offset?: string;
    sort?: SortParameter<TFields>[];
    view?: string;
    cellFormat?: 'json' | 'string';
    timeZone?: string;
    userLocale?: string;
    method?: string;
    returnFieldsByFieldId?: boolean;
}
