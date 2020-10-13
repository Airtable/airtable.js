import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import assign from 'lodash/assign';
import forEach from 'lodash/forEach';
import map from 'lodash/map';
import deprecate from './deprecate';
import Query from './query';
import {QueryParams} from './query_params';
import Record from './record';
import callbackToPromise from './callback_to_promise';
import Base from './base';

type OptionalParameters = {[key: string]: any};

type RecordCallback = (error: any, record?: Record) => void;
type RecordCollectionCallback = (error: any, records?: Record[]) => void;

interface TableFindRecord {
    (recordId: string): Promise<Record>;
    (recordId: string, done: RecordCallback): void;
}

interface TableCreateRecords {
    (recordsData: any[], optionalParameters?: OptionalParameters): Promise<Record[]>;
    (
        recordsData: any[],
        optionalParameters: OptionalParameters,
        done: RecordCollectionCallback
    ): void;
    (recordsData: any[], done: RecordCollectionCallback): void;
    (recordData: any, optionalParameters?: OptionalParameters): Promise<Record>;
    (recordData: any, optionalParameters: OptionalParameters, done: RecordCallback): void;
    (recordData: any, done: RecordCallback): void;
}

interface TableChangeRecords {
    (recordId: string, recordData: any, opts?: OptionalParameters): Promise<Record>;
    (recordId: string, recordData: any, opts: OptionalParameters, done: RecordCallback): void;
    (recordId: string, recordData: any, done: RecordCallback): void;
    (recordsData: any[], opts?: OptionalParameters): Promise<Record[]>;
    (recordsData: any[], opts: OptionalParameters, done: RecordCollectionCallback): void;
    (recordsData: any[], done: RecordCollectionCallback): void;
}

interface TableDestroyRecords {
    (recordId: string): Promise<Record>;
    (recordIds: string[]): Promise<Record[]>;
    (recordIds: string[], done: RecordCollectionCallback): void;
}

class Table {
    readonly _base: Base;

    readonly id: string;
    readonly name: string;

    readonly find: TableFindRecord;
    readonly select: (params?: QueryParams) => Query;
    readonly create: TableCreateRecords;
    readonly update: TableChangeRecords;
    readonly replace: TableChangeRecords;
    readonly destroy: TableDestroyRecords;

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

    _findRecordById(recordId: string, done: RecordCallback) {
        const record = new Record(this, recordId);
        record.fetch(done);
    }

    _selectRecords(params?: QueryParams): Query {
        if (params === void 0) {
            params = {};
        }

        if (arguments.length > 1) {
            console.warn(
                `Airtable: \`select\` takes only one parameter, but it was given ${arguments.length} parameters. Use \`eachPage\` or \`firstPage\` to fetch records.`
            );
        }

        if (isPlainObject(params)) {
            const validationResults = Query.validateParams(params);

            if (validationResults.errors.length) {
                const formattedErrors = map(validationResults.errors, error => {
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

    _createRecords(recordData: any, done: RecordCallback): void;
    _createRecords(
        recordData: any,
        optionalParameters: OptionalParameters,
        done: RecordCallback
    ): void;
    _createRecords(recordsData: any[], done: RecordCollectionCallback): void;
    _createRecords(
        recordsData: any[],
        optionalParameters: OptionalParameters,
        done: RecordCollectionCallback
    ): void;
    _createRecords(recordsData, optionalParameters, done?) {
        const isCreatingMultipleRecords = isArray(recordsData);

        if (!done) {
            done = optionalParameters;
            optionalParameters = {};
        }
        let requestData;
        if (isCreatingMultipleRecords) {
            requestData = {records: recordsData};
        } else {
            requestData = {fields: recordsData};
        }
        assign(requestData, optionalParameters);
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
        recordData: any,
        done: RecordCallback
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordId: string,
        recordData: any,
        opts: OptionalParameters,
        done: RecordCallback
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordsData: any[],
        done: RecordCollectionCallback
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordsData: any[],
        opts: OptionalParameters,
        done: RecordCollectionCallback
    ): void;
    _updateRecords(
        isDestructiveUpdate: boolean,
        recordsDataOrRecordId,
        recordDataOrOptsOrDone,
        optsOrDone?,
        done?
    ) {
        let opts;

        if (isArray(recordsDataOrRecordId)) {
            const recordsData = recordsDataOrRecordId;
            opts = isPlainObject(recordDataOrOptsOrDone) ? recordDataOrOptsOrDone : {};
            done = optsOrDone || recordDataOrOptsOrDone;

            const method = isDestructiveUpdate ? 'put' : 'patch';
            const requestData = assign({records: recordsData}, opts);
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
            const recordId = recordsDataOrRecordId;
            const recordData = recordDataOrOptsOrDone;
            opts = isPlainObject(optsOrDone) ? optsOrDone : {};
            done = done || optsOrDone;

            const record = new Record(this, recordId);
            if (isDestructiveUpdate) {
                record.putUpdate(recordData, opts, done);
            } else {
                record.patchUpdate(recordData, opts, done);
            }
        }
    }

    _destroyRecord(recordId: string, done: RecordCallback): void;
    _destroyRecord(recordIds: string[], done: RecordCollectionCallback): void;
    _destroyRecord(recordIdsOrId, done) {
        if (isArray(recordIdsOrId)) {
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

                    const records = map(results.records, ({id}) => {
                        return new Record(this, id, null);
                    });
                    done(null, records);
                }
            );
        } else {
            const record = new Record(this, recordIdsOrId);
            record.destroy(done);
        }
    }

    _listRecords(limit, offset, opts, done) {
        if (!done) {
            done = opts;
            opts = {};
        }
        const listRecordsParameters = assign(
            {
                limit,
                offset,
            },
            opts
        );

        this._base.runAction(
            'get',
            `/${this._urlEncodedNameOrId()}/`,
            listRecordsParameters,
            null,
            (err, response, results) => {
                if (err) {
                    done(err);
                    return;
                }

                const records = map(results.records, recordJson => {
                    return new Record(this, null, recordJson);
                });
                done(null, records, results.offset);
            }
        );
    }

    _forEachRecord(opts, callback, done) {
        if (arguments.length === 2) {
            done = callback;
            callback = opts;
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

                forEach(page, callback);

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
