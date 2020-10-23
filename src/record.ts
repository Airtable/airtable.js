import callbackToPromise from './callback_to_promise';
import {FieldSet} from './field_set';
import Table from './table';

/* eslint-disable @typescript-eslint/no-explicit-any */
type RecordError = any;
type RecordJson = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type OptionalParameters = {typecast: boolean};

interface RecordCallback<TFields extends FieldSet> {
    (error: null, record: Record<TFields>): void;
    (error: RecordError): void;
}

interface RecordActionMethod<TFields extends FieldSet> {
    (): Promise<Record<TFields>>;
    (done: RecordCallback<TFields>): void;
}

interface RecordChangeMethod<TFields extends FieldSet> {
    (cellValuesByName: TFields, done: RecordCallback<TFields>): void;
    (cellValuesByName: TFields, opts: OptionalParameters, done: RecordCallback<TFields>): void;
    (cellValuesByName: TFields, opts?: OptionalParameters): Promise<Record<TFields>>;
}

class Record<TFields extends FieldSet> {
    readonly _table: Table<TFields>;
    _rawJson: RecordJson;

    readonly id: string;
    fields: TFields;

    readonly save: RecordActionMethod<TFields>;
    readonly patchUpdate: RecordChangeMethod<TFields>;
    readonly putUpdate: RecordChangeMethod<TFields>;
    readonly destroy: RecordActionMethod<TFields>;
    readonly fetch: RecordActionMethod<TFields>;

    readonly updateFields: RecordChangeMethod<TFields>;
    readonly replaceFields: RecordChangeMethod<TFields>;

    constructor(table: Table<TFields>, recordId: string, recordJson?: RecordJson) {
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

    getId(): string {
        return this.id;
    }

    get<Field extends keyof TFields>(columnName: Field): TFields[Field] {
        return this.fields[columnName];
    }

    set<Field extends keyof TFields>(columnName: Field, columnValue: TFields[Field]): void {
        this.fields[columnName] = columnValue;
    }

    setRawJson(rawJson: RecordJson): void {
        this._rawJson = rawJson;
        this.fields = (this._rawJson && this._rawJson.fields) || {};
    }
}

function save<TFields extends FieldSet>(this: Record<TFields>, done: RecordCallback<TFields>) {
    this.putUpdate(this.fields, done);
}

function patchUpdate<TFields extends FieldSet>(
    this: Record<TFields>,
    cellValuesByName,
    opts,
    done?: RecordCallback<TFields>
) {
    if (!done) {
        done = opts;
        opts = {};
    }
    const updateBody = {
        fields: cellValuesByName,
        ...opts,
    };

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

function putUpdate<TFields extends FieldSet>(
    this: Record<TFields>,
    cellValuesByName,
    opts,
    done?: RecordCallback<TFields>
) {
    if (!done) {
        done = opts;
        opts = {};
    }
    const updateBody = {
        fields: cellValuesByName,
        ...opts,
    };

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

function destroy<TFields extends FieldSet>(this: Record<TFields>, done: RecordCallback<TFields>) {
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

function fetch<TFields extends FieldSet>(this: Record<TFields>, done: RecordCallback<TFields>) {
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
