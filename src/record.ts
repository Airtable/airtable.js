import assign from 'lodash/assign';
import callbackToPromise from './callback_to_promise';
import Table from './table';

interface RecordCallback {
    (error: null, record: Record): void;
    (error: any): void;
}

interface RecordActionMethod {
    (): Promise<Record>;
    (done: RecordCallback): void;
}

interface RecordChangeMethod {
    (cellValuesByName: any, done: RecordCallback): void;
    (cellValuesByName: any, opts: any, done: RecordCallback): void;
    (cellValuesByName: any, opts?: any): Promise<Record>;
}

class Record {
    readonly _table: Table;
    _rawJson: any;

    readonly id: string;
    fields: any;

    readonly save: RecordActionMethod;
    readonly patchUpdate: RecordChangeMethod;
    readonly putUpdate: RecordChangeMethod;
    readonly destroy: RecordActionMethod;
    readonly fetch: RecordActionMethod;

    readonly updateFields: RecordChangeMethod;
    readonly replaceFields: RecordChangeMethod;

    constructor(table: Table, recordId: string, recordJson?: any) {
        this._table = table;
        this.id = recordId || recordJson.id;
        this.setRawJson(recordJson);

        this.save = callbackToPromise(save, this);
        this.patchUpdate = callbackToPromise(patchUpdate, this);
        this.putUpdate = callbackToPromise(putUpdate, this);
        this.destroy = callbackToPromise(destroy, this);
        this.fetch = callbackToPromise(fetch, this);

        this.updateFields = this.patchUpdate;
        this.replaceFields = this.putUpdate;
    }

    getId() {
        return this.id;
    }

    get(columnName: string) {
        return this.fields[columnName];
    }

    set(columnName: string, columnValue: any) {
        this.fields[columnName] = columnValue;
    }

    setRawJson(rawJson: any) {
        this._rawJson = rawJson;
        this.fields = (this._rawJson && this._rawJson.fields) || {};
    }
}

function save(this: Record, done: RecordCallback) {
    this.putUpdate(this.fields, done);
}

function patchUpdate(this: Record, cellValuesByName, opts, done?: RecordCallback) {
    if (!done) {
        done = opts;
        opts = {};
    }
    const updateBody = assign(
        {
            fields: cellValuesByName,
        },
        opts
    );

    this._table._base.runAction(
        'patch',
        `/${this._table._urlEncodedNameOrId()}/${this.id}`,
        {},
        updateBody,
        (err, response, results) => {
            if (err) {
                done(err);
                return;
            }

            this.setRawJson(results);
            done(null, this);
        }
    );
}

function putUpdate(this: Record, cellValuesByName, opts, done?: RecordCallback) {
    if (!done) {
        done = opts;
        opts = {};
    }
    const updateBody = assign(
        {
            fields: cellValuesByName,
        },
        opts
    );
    this._table._base.runAction(
        'put',
        `/${this._table._urlEncodedNameOrId()}/${this.id}`,
        {},
        updateBody,
        (err, response, results) => {
            if (err) {
                done(err);
                return;
            }

            this.setRawJson(results);
            done(null, this);
        }
    );
}

function destroy(this: Record, done: RecordCallback) {
    this._table._base.runAction(
        'delete',
        `/${this._table._urlEncodedNameOrId()}/${this.id}`,
        {},
        null,
        err => {
            if (err) {
                done(err);
                return;
            }

            done(null, this);
        }
    );
}

function fetch(this: Record, done: RecordCallback) {
    this._table._base.runAction(
        'get',
        `/${this._table._urlEncodedNameOrId()}/${this.id}`,
        {},
        null,
        (err, response, results) => {
            if (err) {
                done(err);
                return;
            }

            this.setRawJson(results);
            done(null, this);
        }
    );
}

export = Record;
