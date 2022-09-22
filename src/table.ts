import isPlainObject from 'lodash/isPlainObject';
import deprecate from './deprecate';
import Query from './query';
import {
    QueryParams,
    shouldListRecordsParamBePassedAsParameter,
    URL_CHARACTER_LENGTH_LIMIT,
} from './query_params';
import objectToQueryParamString from './object_to_query_param_string';
import Record from './record';
import callbackToPromise from './callback_to_promise';
import Base from './base';
import {Records} from './records';
import {FieldSet} from './field_set';
import {RecordData} from './record_data';

/* eslint-disable @typescript-eslint/no-explicit-any */
type TableError = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type CreateRecord<TFields> = Pick<RecordData<Partial<TFields>>, 'fields'>;
type CreateRecords<TFields> = string[] | Partial<TFields>[] | CreateRecord<TFields>[];

type OptionalParameters = {
    typecast?: boolean;
    method?: 'get' | 'post';
};

type RecordCollectionCallback<TFields extends FieldSet> = (
    error: TableError,
    records?: Records<TFields>
) => void;
type RecordCallback<TFields extends FieldSet> = (
    error: TableError,
    record?: Record<TFields>
) => void;
type RecordListCallback<TFields extends FieldSet> = (
    error: TableError,
    records?: Records<TFields>,
    offset?: number
) => void;
type RecordForEachCallback<TFields extends FieldSet> = (record: Record<TFields>) => void;
type RecordForEachDoneCallback = (error?: TableError) => void;

interface TableFindRecord<TFields extends FieldSet> {
    (recordId: string): Promise<Record<TFields>>;
    (recordId: string, done: RecordCallback<TFields>): void;
}

interface TableSelectRecord<TFields extends FieldSet> {
    (params?: QueryParams<TFields>): Query<TFields>;
}

interface TableCreateRecords<TFields extends FieldSet> {
    (recordsData: CreateRecords<TFields>, optionalParameters?: OptionalParameters): Promise<
        Records<TFields>
    >;
    (
        recordsData: CreateRecords<TFields>,
        optionalParameters: OptionalParameters,
        done: RecordCollectionCallback<TFields>
    ): void;
    (recordsData: CreateRecords<TFields>, done: RecordCollectionCallback<TFields>): void;
    (recordData: string | Partial<TFields>, optionalParameters?: OptionalParameters): Promise<
        Record<TFields>
    >;
    (
        recordData: string | Partial<TFields>,
        optionalParameters: OptionalParameters,
        done: RecordCallback<TFields>
    ): void;
    (recordData: string | Partial<TFields>, done: RecordCallback<TFields>): void;
}

interface TableChangeRecords<TFields extends FieldSet> {
    (recordId: string, recordData: Partial<TFields>, opts?: OptionalParameters): Promise<
        Record<TFields>
    >;
    (
        recordId: string,
        recordData: Partial<TFields>,
        opts: OptionalParameters,
        done: RecordCallback<TFields>
    ): void;
    (recordId: string, recordData: Partial<TFields>, done: RecordCallback<TFields>): void;
    (recordsData: RecordData<Partial<TFields>>[], opts?: OptionalParameters): Promise<
        Records<TFields>
    >;
    (
        recordsData: RecordData<Partial<TFields>>[],
        opts: OptionalParameters,
        done: RecordCollectionCallback<TFields>
    ): void;
    (recordsData: RecordData<Partial<TFields>>[], done: RecordCollectionCallback<TFields>): void;
}

interface TableDestroyRecords<TFields extends FieldSet> {
    (recordId: string): Promise<Record<TFields>>;
    (recordId: string, done: RecordCallback<TFields>): void;
    (recordIds: string[]): Promise<Records<TFields>>;
    (recordIds: string[], done: RecordCollectionCallback<TFields>): void;
}
class Table<TFields extends FieldSet> {
    readonly _base: Base;

    readonly id: string;
    readonly name: string;

    readonly find: TableFindRecord<TFields>;
    readonly select: TableSelectRecord<TFields>;
    readonly create: TableCreateRecords<TFields>;
    readonly update: TableChangeRecords<TFields>;
    readonly replace: TableChangeRecords<TFields>;
    readonly destroy: TableDestroyRecords<TFields>;

    /** @deprecated */
    readonly list;
    /** @deprecated */
    readonly forEach;

    static __recordsPerPageForIteration: number;

    constructor(base: Base, tableId: string, tableName: string) {
        if (!tableId && !tableName) {
            throw new Error('Table name or table ID is required');
        }

        this._base = base;
        this.id = tableId;
        this.name = tableName;

        // Public API
        this.find = callbackToPromise(this._findRecordById, this);
        this.select = this._selectRecords.bind(this);
        this.create = callbackToPromise(this._createRecords, this);
        this.update = callbackToPromise(this._updateRecords.bind(this, false), this);
        this.replace = callbackToPromise(this._updateRecords.bind(this, true), this);
        this.destroy = callbackToPromise(this._destroyRecord, this);

        // Deprecated API
        this.list = deprecate(
            this._listRecords.bind(this),
            'table.list',
            'Airtable: `list()` is deprecated. Use `select()` instead.'
        );
        this.forEach = deprecate(
            this._forEachRecord.bind(this),
            'table.forEach',
            'Airtable: `forEach()` is deprecated. Use `select()` instead.'
        );
    }

    _findRecordById(recordId: string, done: RecordCallback<TFields>): void {
        const record = new Record(this, recordId);
        record.fetch(done);
    }

    _selectRecords(params?: QueryParams<TFields>): Query<TFields> {
        if (params === void 0) {
            params = {};
        }

        if (arguments.length > 1) {
            console.warn(
                `Airtable: \`select\` takes only one parameter, but it was given ${arguments.length} parameters. Use \`eachPage\` or \`firstPage\` to fetch records.`
            );
        }

        if (isPlainObject(params)) {
            const validationResults = Query.validateParams<TFields>(params);

            if (validationResults.errors.length) {
                const formattedErrors = validationResults.errors.map(error => {
                    return `  * ${error}`;
                });

                throw new Error(
                    `Airtable: invalid parameters for \`select\`:\n${formattedErrors.join('\n')}`
                );
            }

            if (validationResults.ignoredKeys.length) {
                console.warn(
                    `Airtable: the following parameters to \`select\` will be ignored: ${validationResults.ignoredKeys.join(
                        ', '
                    )}`
                );
            }

            return new Query(this, validationResults.validParams);
        } else {
            throw new Error(
                'Airtable: the parameter for `select` should be a plain object or undefined.'
            );
        }
    }

    _urlEncodedNameOrId(): string {
        return this.id || encodeURIComponent(this.name);
    }

    _createRecords(recordData: TFields, done: RecordCallback<TFields>): void;
    _createRecords(
        recordData: TFields,
        optionalParameters: OptionalParameters,
        done: RecordCallback<TFields>
    ): void;
    _createRecords(recordsData: TFields[], done: RecordCollectionCallback<TFields>): void;
    _createRecords(
        recordsData: TFields[],
        optionalParameters: OptionalParameters,
        done: RecordCollectionCallback<TFields>
    ): void;
    _createRecords(
        recordsData: TFields | TFields[],
        optionalParameters:
            | OptionalParameters
            | RecordCallback<TFields>
            | RecordCollectionCallback<TFields>,
        done?: RecordCallback<TFields> | RecordCollectionCallback<TFields>
    ): void | Promise<Record<TFields>> | Promise<Records<TFields>> {
        const isCreatingMultipleRecords = Array.isArray(recordsData);

        if (!done) {
            done = optionalParameters as
                | RecordCallback<TFields>
                | RecordCollectionCallback<TFields>;
            optionalParameters = {};
        }
        let requestData;
        if (isCreatingMultipleRecords) {
            requestData = {records: recordsData, ...optionalParameters};
        } else {
            requestData = {fields: recordsData, ...optionalParameters};
        }

        this._base.runAction(
            'post',
            `/${this._urlEncodedNameOrId()}/`,
            {},
            requestData,
            (err, resp, body) => {
                if (err) {
                    done(err);
                    return;
                }

                let result;
                if (isCreatingMultipleRecords) {
                    result = body.records.map(record => {
                        return new Record(this, record.id, record);
                    });
                } else {
                    result = new Record(this, body.id, body);
                }
                done(null, result);
            }
        );
    }

    _updateRecords(
        isDestructiveUpdate: boolean,
        recordId: string,
        recordData: TFields,
        done: RecordCallback<TFields>
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordId: string,
        recordData: TFields,
        opts: OptionalParameters,
        done: RecordCallback<TFields>
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordsData: TFields[],
        done: RecordCollectionCallback<TFields>
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordsData: TFields[],
        opts: OptionalParameters,
        done: RecordCollectionCallback<TFields>
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordsDataOrRecordId: string | TFields[],
        recordDataOrOptsOrDone: TFields | OptionalParameters | RecordCollectionCallback<TFields>,
        optsOrDone?:
            | OptionalParameters
            | RecordCallback<TFields>
            | RecordCollectionCallback<TFields>,
        done?: RecordCallback<TFields> | RecordCollectionCallback<TFields>
    ): void | Promise<Record<TFields>> | Promise<Records<TFields>> {
        let opts;

        if (Array.isArray(recordsDataOrRecordId)) {
            const recordsData = recordsDataOrRecordId;
            opts = isPlainObject(recordDataOrOptsOrDone) ? recordDataOrOptsOrDone : {};
            done = (optsOrDone || recordDataOrOptsOrDone) as RecordCollectionCallback<TFields>;

            const method = isDestructiveUpdate ? 'put' : 'patch';
            const requestData = {records: recordsData, ...opts};
            this._base.runAction(
                method,
                `/${this._urlEncodedNameOrId()}/`,
                {},
                requestData,
                (err, resp, body) => {
                    if (err) {
                        done(err);
                        return;
                    }

                    const result = body.records.map(record => {
                        return new Record(this, record.id, record);
                    });
                    done(null, result);
                }
            );
        } else {
            const recordId = recordsDataOrRecordId as string;
            const recordData = recordDataOrOptsOrDone as TFields;
            opts = isPlainObject(optsOrDone) ? optsOrDone : {};
            done = (done || optsOrDone) as RecordCallback<TFields>;

            const record = new Record(this, recordId);
            if (isDestructiveUpdate) {
                record.putUpdate(recordData, opts, done);
            } else {
                record.patchUpdate(recordData, opts, done);
            }
        }
    }

    _destroyRecord(recordId: string, done: RecordCallback<TFields>): void;
    _destroyRecord(recordIds: string[], done: RecordCollectionCallback<TFields>): void;
    _destroyRecord(
        recordIdsOrId: string | string[],
        done: RecordCallback<TFields> | RecordCollectionCallback<TFields>
    ): void | Promise<Record<TFields>> | Promise<Record<TFields>> {
        if (Array.isArray(recordIdsOrId)) {
            const queryParams = {records: recordIdsOrId};
            this._base.runAction(
                'delete',
                `/${this._urlEncodedNameOrId()}`,
                queryParams,
                null,
                (err, response, results) => {
                    if (err) {
                        done(err);
                        return;
                    }

                    const records = results.records.map(({id}) => {
                        return new Record(this, id, null);
                    });
                    (done as RecordCollectionCallback<TFields>)(null, records);
                }
            );
        } else {
            const record = new Record(this, recordIdsOrId);
            record.destroy(done as RecordCallback<TFields>);
        }
    }

    _listRecords(
        pageSize: number,
        offset: number,
        opts: OptionalParameters | RecordListCallback<TFields>,
        done?: RecordListCallback<TFields>
    ): void {
        if (!done) {
            done = opts as RecordListCallback<TFields>;
            opts = {};
        }

        const pathAndParamsAsString = `/${this._urlEncodedNameOrId()}?${objectToQueryParamString(
            opts
        )}`;

        let path;
        let listRecordsParameters = {};
        let listRecordsData = null;
        let method;

        if (
            (typeof opts !== 'function' && opts.method === 'post') ||
            pathAndParamsAsString.length > URL_CHARACTER_LENGTH_LIMIT
        ) {
            // // There is a 16kb limit on GET requests. Since the URL makes up nearly all of the request size, we check for any requests that
            // that come close to this limit and send it as a POST instead. Additionally, we'll send the request as a post if it is specified
            // with the request params

            path = `/${this._urlEncodedNameOrId()}/listRecords`;
            listRecordsData = {
                // limit is deprecated and the GET request parser in hyperbase automatically
                // replaces this but the body parser used for POST requests does not
                ...(pageSize && {pageSize}),
                // The request parser will error if offset is included and is undefined
                ...(offset && {offset}),
            };
            method = 'post';

            const paramNames = Object.keys(opts);

            for (const paramName of paramNames) {
                if (shouldListRecordsParamBePassedAsParameter(paramName)) {
                    listRecordsParameters[paramName] = opts[paramName];
                } else {
                    listRecordsData[paramName] = opts[paramName];
                }
            }
        } else {
            method = 'get';
            path = `/${this._urlEncodedNameOrId()}/`;
            listRecordsParameters = {
                limit: pageSize,
                offset,
                ...opts,
            };
        }

        this._base.runAction(
            method,
            path,
            listRecordsParameters,
            listRecordsData,
            (err, response, results) => {
                if (err) {
                    done(err);
                    return;
                }

                const records = results.records.map(recordJson => {
                    return new Record(this, null, recordJson);
                });
                done(null, records, results.offset);
            }
        );
    }

    _forEachRecord(
        opts: OptionalParameters,
        callback: RecordForEachCallback<TFields>,
        done: RecordForEachDoneCallback
    ): void {
        if (arguments.length === 2) {
            done = callback as RecordForEachDoneCallback;
            callback = opts as RecordForEachCallback<TFields>;
            opts = {};
        }
        const limit = Table.__recordsPerPageForIteration || 100;
        let offset = null;

        const nextPage = () => {
            this._listRecords(limit, offset, opts, (err, page, newOffset) => {
                if (err) {
                    done(err);
                    return;
                }

                for (let index = 0; index < page.length; index++) {
                    callback(page[index]);
                }

                if (newOffset) {
                    offset = newOffset;
                    nextPage();
                } else {
                    done();
                }
            });
        };
        nextPage();
    }
}

export = Table;
