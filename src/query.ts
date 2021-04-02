import isFunction from 'lodash/isFunction';
import keys from 'lodash/keys';
import Record from './record';
import callbackToPromise from './callback_to_promise';
import has from './has';
import Table from './table';
import {paramValidators, QueryParams} from './query_params';
import {FieldSet} from './field_set';
import {Records} from './records';

/* eslint-disable @typescript-eslint/no-explicit-any */
type CallbackError = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type PageCallback<TFields extends FieldSet> = (
    records: Records<TFields>,
    processNextPage: () => void
) => void;
type RecordCollectionCallback<TFields extends FieldSet> = (
    error: CallbackError,
    records?: Records<TFields>
) => void;
type DoneCallback = (error: CallbackError) => void;

interface RecordCollectionRequestMethod<TFields extends FieldSet> {
    (): Promise<Records<TFields>>;
    (done: RecordCollectionCallback<TFields>): void;
}

interface RecordPageIteratationMethod<TFields extends FieldSet> {
    (pageCallback: PageCallback<TFields>): Promise<void>;
    (pageCallback: PageCallback<TFields>, done: DoneCallback): void;
}

/**
 * Builds a query object. Won't fetch until `firstPage` or
 * or `eachPage` is called.
 *
 * Params should be validated prior to being passed to Query
 * with `Query.validateParams`.
 */
class Query<TFields extends FieldSet> {
    readonly _table: Table<TFields>;
    readonly _params: QueryParams<TFields>;

    readonly firstPage: RecordCollectionRequestMethod<TFields>;
    readonly eachPage: RecordPageIteratationMethod<TFields>;
    readonly all: RecordCollectionRequestMethod<TFields>;

    static paramValidators = paramValidators;

    constructor(table: Table<TFields>, params: QueryParams<TFields>) {
        this._table = table;
        this._params = params;

        this.firstPage = callbackToPromise(firstPage, this);
        this.eachPage = callbackToPromise(eachPage, this, 1);
        this.all = callbackToPromise(all, this);
    }

    /**
     * Validates the parameters for passing to the Query constructor.
     *
     * @params {object} params parameters to validate
     *
     * @return an object with two keys:
     *  validParams: the object that should be passed to the constructor.
     *  ignoredKeys: a list of keys that will be ignored.
     *  errors: a list of error messages.
     */
    static validateParams<
        TFields extends FieldSet,
        Params extends QueryParams<TFields> = QueryParams<TFields>
    >(
        params: Params
    ): {
        validParams: QueryParams<TFields>;
        ignoredKeys: string[];
        errors: string[];
    } {
        const validParams: QueryParams<TFields> = {};
        const ignoredKeys = [];
        const errors = [];

        for (const key of keys(params)) {
            const value = params[key];
            if (has(Query.paramValidators, key)) {
                const validator = Query.paramValidators[key];
                const validationResult = validator(value);
                if (validationResult.pass) {
                    validParams[key] = value;
                } else {
                    errors.push(validationResult.error);
                }
            } else {
                ignoredKeys.push(key);
            }
        }

        return {
            validParams,
            ignoredKeys,
            errors,
        };
    }
}

/**
 * Fetches the first page of results for the query asynchronously,
 * then calls `done(error, records)`.
 */
function firstPage<TFields extends FieldSet>(
    this: Query<TFields>,
    done: RecordCollectionCallback<TFields>
) {
    if (!isFunction(done)) {
        throw new Error('The first parameter to `firstPage` must be a function');
    }

    this.eachPage(
        records => {
            done(null, records);
        },
        error => {
            done(error, null);
        }
    );
}

/**
 * Fetches each page of results for the query asynchronously.
 *
 * Calls `pageCallback(records, fetchNextPage)` for each
 * page. You must call `fetchNextPage()` to fetch the next page of
 * results.
 *
 * After fetching all pages, or if there's an error, calls
 * `done(error)`.
 */
function eachPage<TFields extends FieldSet>(
    this: Query<TFields>,
    pageCallback: PageCallback<TFields>,
    done: DoneCallback
) {
    if (!isFunction(pageCallback)) {
        throw new Error('The first parameter to `eachPage` must be a function');
    }

    if (!isFunction(done) && done !== void 0) {
        throw new Error('The second parameter to `eachPage` must be a function or undefined');
    }

    const path = `/${this._table._urlEncodedNameOrId()}`;
    const params = {...this._params};

    const inner = () => {
        this._table._base.runAction('get', path, params, null, (err, response, result) => {
            if (err) {
                done(err, null);
            } else {
                let next;
                if (result.offset) {
                    params.offset = result.offset;
                    next = inner;
                } else {
                    next = () => {
                        done(null);
                    };
                }

                const records = result.records.map(recordJson => {
                    return new Record(this._table, null, recordJson);
                });

                pageCallback(records, next);
            }
        });
    };

    inner();
}

/**
 * Fetches all pages of results asynchronously. May take a long time.
 */
function all<TFields extends FieldSet>(
    this: Query<TFields>,
    done: RecordCollectionCallback<TFields>
) {
    if (!isFunction(done)) {
        throw new Error('The first parameter to `all` must be a function');
    }

    const allRecords = [];
    this.eachPage(
        (pageRecords, fetchNextPage) => {
            allRecords.push(...pageRecords);
            fetchNextPage();
        },
        err => {
            if (err) {
                done(err, null);
            } else {
                done(null, allRecords);
            }
        }
    );
}

export = Query;
