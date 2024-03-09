import { type RegisteredFetchOptions } from "./airtable";
import { type FieldSet } from "./field_set";
import { inlineError } from "./inline_error";
import { type Table } from "./table";

export type RecordJson<TFields extends FieldSet> = {
  [key: string]: unknown;
  commentCount?: number;
  fields?: TFields;
  id: string;
};

type OptionalParameters = { fetchOptions?: RegisteredFetchOptions; typecast?: boolean };

export class Record<TFields extends FieldSet> {
  public _rawJson?: RecordJson<TFields>;

  public readonly id: string;
  public readonly commentCount?: number;
  public fields!: TFields;

  constructor(
    private table: Table<TFields>,
    recordId: string,
    recordJson?: RecordJson<TFields>,
  ) {
    this.id = recordId || recordJson?.id || inlineError(new Error("Record ID is required"));
    if (recordJson) {
      this.commentCount = recordJson.commentCount;
    }
    this.setRawJson(recordJson);
  }

  public getId(): string {
    return this.id;
  }

  public get<Field extends keyof TFields>(columnName: Field): TFields[Field] {
    return this.fields[columnName];
  }

  public set<Field extends keyof TFields>(columnName: Field, columnValue: TFields[Field]): void {
    this.fields[columnName] = columnValue;
  }

  public setRawJson<TLocalFields extends TFields>(rawJson?: RecordJson<TLocalFields>): void {
    this._rawJson = rawJson;
    this.fields = this._rawJson?.fields ?? ({} as TFields);
  }

  public async patchUpdate<TLocalFields extends TFields>(
    cellValuesByName: TLocalFields,
    opts: OptionalParameters = {},
  ) {
    const updateBody = {
      fields: cellValuesByName,
      ...("typecast" in opts ? { typecast: opts.typecast } : {}),
    };

    const result = await this.table.base.makeRequest(
      {
        method: "patch",
        path: `/${this.table._urlEncodedNameOrId()}/${this.id}`,
        body: updateBody,
      },
      opts.fetchOptions ?? {},
    );

    this.setRawJson(result.body as RecordJson<TLocalFields>);

    return this;
  }

  public async updateFields<TLocalFields extends TFields>(
    cellValuesByName: TLocalFields,
    opts: OptionalParameters = {},
  ) {
    return this.patchUpdate(cellValuesByName, opts);
  }

  public async putUpdate<TLocalFields extends TFields>(cellValuesByName: TLocalFields, opts: OptionalParameters = {}) {
    const updateBody = {
      fields: cellValuesByName,
      ...("typecast" in opts ? { typecast: opts.typecast } : {}),
    };

    const result = await this.table.base.makeRequest(
      {
        method: "put",
        path: `/${this.table._urlEncodedNameOrId()}/${this.id}`,
        body: updateBody,
      },
      opts.fetchOptions ?? {},
    );

    this.setRawJson(result.body as RecordJson<TLocalFields>);

    return this;
  }

  public async replaceFields<TLocalFields extends TFields>(
    cellValuesByName: TLocalFields,
    opts: OptionalParameters = {},
  ) {
    return this.putUpdate(cellValuesByName, opts);
  }

  public async save(fetchOptions?: RegisteredFetchOptions) {
    return this.putUpdate(this.fields, { fetchOptions });
  }

  public async destroy(fetchOptions?: RegisteredFetchOptions) {
    await this.table.base.makeRequest(
      {
        method: "delete",
        path: `/${this.table._urlEncodedNameOrId()}/${this.id}`,
      },
      fetchOptions,
    );
  }

  public async fetch(fetchOptions?: RegisteredFetchOptions) {
    const result = await this.table.base.makeRequest(
      {
        method: "get",
        path: `/${this.table._urlEncodedNameOrId()}/${this.id}`,
      },
      fetchOptions,
    );

    this.setRawJson(result.body as RecordJson<TFields>);

    return this;
  }
}
