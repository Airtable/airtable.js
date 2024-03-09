import { type RegisteredFetchOptions } from "./airtable";
import { type Base } from "./base";
import { type FieldSet } from "./field_set";
import { Query } from "./query";
import { type QueryParams } from "./query_params";
import { Record, type RecordJson } from "./record";
import { type RecordData } from "./record_data";
import { type Records } from "./records";

type OptionalParameters = {
  fetchOptions?: RegisteredFetchOptions;
  method?: "get" | "post";
  typecast?: boolean;
};

type CreateRecord<TFields> = Pick<RecordData<Partial<TFields>>, "fields">;
type CreateRecords<TFields> = Array<CreateRecord<TFields>> | Array<Partial<TFields>> | string[];

export class Table<TFields extends FieldSet> {
  public readonly id?: string;
  public readonly name?: string;

  public static __recordsPerPageForIteration: number;

  constructor(
    public readonly base: Base,
    tableId?: string,
    tableName?: string,
  ) {
    if (!tableId && !tableName) {
      throw new Error("Table name or table ID is required");
    }

    this.id = tableId;
    this.name = tableName;
  }

  public find(recordId: string, fetchOptions?: RegisteredFetchOptions): Promise<Record<TFields>> {
    const record = new Record(this, recordId);
    return record.fetch(fetchOptions);
  }

  public select(params: QueryParams<TFields> = {}, fetchOptions?: RegisteredFetchOptions): Query<TFields> {
    const validationResults = Query.validateParams<TFields>(params);

    if (validationResults.errors.length) {
      const formattedErrors = validationResults.errors.map(error => {
        return `  * ${error}`;
      });

      throw new Error(`Airtable: invalid parameters for \`select\`:\n${formattedErrors.join("\n")}`);
    }

    if (validationResults.ignoredKeys.length) {
      console.warn(
        `Airtable: the following parameters to \`select\` will be ignored: ${validationResults.ignoredKeys.join(", ")}`,
      );
    }

    return new Query<TFields>(this, validationResults.validParams, fetchOptions);
  }

  public _urlEncodedNameOrId(): string {
    return this.id || encodeURIComponent(this.name!);
  }

  public async create(
    recordData: Partial<TFields> | string,
    optionalParameters?: OptionalParameters,
  ): Promise<Record<TFields>>;
  public async create(
    recordsData: CreateRecords<TFields>,
    optionalParameters?: OptionalParameters,
  ): Promise<Records<TFields>>;
  public async create(
    recordsData: CreateRecords<TFields> | Partial<TFields> | string,
    optionalParameters: OptionalParameters = {},
  ): Promise<Record<TFields> | Records<TFields>> {
    const isCreatingMultipleRecords = Array.isArray(recordsData);

    let requestData;
    const additionalData = "typecast" in optionalParameters ? { typecast: optionalParameters.typecast } : {};
    if (isCreatingMultipleRecords) {
      requestData = { records: recordsData, ...additionalData };
    } else {
      requestData = { fields: recordsData, ...additionalData };
    }

    const result = await this.base.makeRequest(
      {
        method: "post",
        path: `/${this._urlEncodedNameOrId()}/`,
        body: requestData,
      },
      optionalParameters.fetchOptions,
    );

    if (isCreatingMultipleRecords) {
      return (result.body as { records: Array<RecordJson<TFields>> }).records.map(record => {
        return new Record(this, record.id, record);
      });
    } else {
      const body = result.body as RecordJson<TFields>;
      return new Record(this, body.id, body);
    }
  }

  public async _updateRecords(
    isDestructiveUpdate: boolean,
    recordsDataOrRecordId: Array<RecordData<Partial<TFields>>> | string,
    recordDataOrOpts?: OptionalParameters | RecordData<Partial<TFields>>,
    optionalParameters?: OptionalParameters,
  ): Promise<Record<TFields> | Records<TFields>> {
    const isUpdatingMultipleRecords = Array.isArray(recordsDataOrRecordId);
    let opts: OptionalParameters;

    if (isUpdatingMultipleRecords) {
      const recordsData = recordsDataOrRecordId;
      opts = (recordDataOrOpts as OptionalParameters) ?? {};

      const method = isDestructiveUpdate ? "put" : "patch";
      const additionalData = "typecast" in opts ? { typecast: opts.typecast } : {};
      const requestData = { records: recordsData, ...additionalData };

      const result = await this.base.makeRequest(
        {
          method,
          path: `/${this._urlEncodedNameOrId()}/`,
          body: requestData,
        },
        opts.fetchOptions,
      );

      return (result.body as { records: Array<RecordJson<TFields>> }).records.map(record => {
        return new Record(this, record.id, record);
      });
    } else {
      const recordId = recordsDataOrRecordId;
      const recordData = recordDataOrOpts as TFields;
      opts = optionalParameters ?? {};

      const record = new Record(this, recordId);
      if (isDestructiveUpdate) {
        return record.putUpdate(recordData, opts);
      } else {
        return record.patchUpdate(recordData, opts);
      }
    }
  }

  public async update(
    recordId: string,
    recordData: RecordData<Partial<TFields>>,
    optionalParameters?: OptionalParameters,
  ): Promise<Record<TFields>>;
  public async update(
    recordsData: Array<RecordData<Partial<TFields>>>,
    optionalParameters?: OptionalParameters,
  ): Promise<Records<TFields>>;
  public async update(
    recordsDataOrRecordId: Array<RecordData<Partial<TFields>>> | string,
    recordDataOrOpts?: OptionalParameters | RecordData<Partial<TFields>>,
    optionalParameters?: OptionalParameters,
  ): Promise<Record<TFields> | Records<TFields>> {
    return this._updateRecords(false, recordsDataOrRecordId, recordDataOrOpts, optionalParameters);
  }

  public replace(
    recordId: string,
    recordData: RecordData<Partial<TFields>>,
    optionalParameters?: OptionalParameters,
  ): Promise<Record<TFields>>;
  public replace(
    recordsData: Array<RecordData<Partial<TFields>>>,
    optionalParameters?: OptionalParameters,
  ): Promise<Records<TFields>>;
  public async replace(
    recordsDataOrRecordId: Array<RecordData<Partial<TFields>>> | string,
    recordDataOrOpts?: OptionalParameters | RecordData<Partial<TFields>>,
    optionalParameters?: OptionalParameters,
  ): Promise<Record<TFields> | Records<TFields>> {
    return this._updateRecords(true, recordsDataOrRecordId, recordDataOrOpts, optionalParameters);
  }

  public async destroy(recordId: string, optionalParameters?: OptionalParameters): Promise<Record<TFields>>;
  public async destroy(recordIds: string[], optionalParameters?: OptionalParameters): Promise<Records<TFields>>;
  public async destroy(
    recordIdsOrId: string[] | string,
    optionalParameters?: OptionalParameters,
  ): Promise<Record<TFields> | Records<TFields>> {
    const isDestroyingMultipleRecords = Array.isArray(recordIdsOrId);

    if (isDestroyingMultipleRecords) {
      const queryParams = { records: recordIdsOrId };
      const result = await this.base.makeRequest(
        {
          method: "delete",
          path: `/${this._urlEncodedNameOrId()}`,
          qs: queryParams,
        },
        optionalParameters?.fetchOptions,
      );

      return (result.body as { records: Array<RecordJson<TFields>> }).records.map(record => {
        return new Record(this, record.id, record);
      });
    } else {
      const record = new Record(this, recordIdsOrId);
      await record.destroy(optionalParameters?.fetchOptions);
      return record;
    }
  }

  // _listRecords(
  //   pageSize: number,
  //   offset: number,
  //   opts: OptionalParameters | RecordListCallback<TFields>,
  //   done?: RecordListCallback<TFields>,
  // ): void {
  //   if (!done) {
  //     done = opts as RecordListCallback<TFields>;
  //     opts = {};
  //   }

  //   const pathAndParamsAsString = `/${this._urlEncodedNameOrId()}?${objectToQueryParamString(opts)}`;

  //   let path;
  //   let listRecordsParameters = {};
  //   let listRecordsData = null;
  //   let method;

  //   if (
  //     (typeof opts !== "function" && opts.method === "post") ||
  //     pathAndParamsAsString.length > URL_CHARACTER_LENGTH_LIMIT
  //   ) {
  //     // // There is a 16kb limit on GET requests. Since the URL makes up nearly all of the request size, we check for any requests that
  //     // that come close to this limit and send it as a POST instead. Additionally, we'll send the request as a post if it is specified
  //     // with the request params

  //     path = `/${this._urlEncodedNameOrId()}/listRecords`;
  //     listRecordsData = {
  //       // limit is deprecated and the GET request parser in hyperbase automatically
  //       // replaces this but the body parser used for POST requests does not
  //       ...(pageSize && { pageSize }),
  //       // The request parser will error if offset is included and is undefined
  //       ...(offset && { offset }),
  //     };
  //     method = "post";

  //     const paramNames = Object.keys(opts);

  //     for (const paramName of paramNames) {
  //       if (shouldListRecordsParamBePassedAsParameter(paramName)) {
  //         listRecordsParameters[paramName] = opts[paramName];
  //       } else {
  //         listRecordsData[paramName] = opts[paramName];
  //       }
  //     }
  //   } else {
  //     method = "get";
  //     path = `/${this._urlEncodedNameOrId()}/`;
  //     listRecordsParameters = {
  //       limit: pageSize,
  //       offset,
  //       ...opts,
  //     };
  //   }

  //   this._base.runAction(method, path, listRecordsParameters, listRecordsData, (err, response, results) => {
  //     if (err) {
  //       done(err);
  //       return;
  //     }

  //     const records = results.records.map(recordJson => {
  //       return new Record(this, null, recordJson);
  //     });
  //     done(null, records, results.offset);
  //   });
  // }

  // _forEachRecord(
  //   opts: OptionalParameters,
  //   callback: RecordForEachCallback<TFields>,
  //   done: RecordForEachDoneCallback,
  // ): void {
  //   if (arguments.length === 2) {
  //     done = callback as RecordForEachDoneCallback;
  //     callback = opts as RecordForEachCallback<TFields>;
  //     opts = {};
  //   }
  //   const limit = Table.__recordsPerPageForIteration || 100;
  //   let offset = null;

  //   const nextPage = () => {
  //     this._listRecords(limit, offset, opts, (err, page, newOffset) => {
  //       if (err) {
  //         done(err);
  //         return;
  //       }

  //       for (let index = 0; index < page.length; index++) {
  //         callback(page[index]);
  //       }

  //       if (newOffset) {
  //         offset = newOffset;
  //         nextPage();
  //       } else {
  //         done();
  //       }
  //     });
  //   };
  //   nextPage();
  // }
}
