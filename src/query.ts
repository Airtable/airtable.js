import { type RegisteredFetchOptions } from "./airtable";
import { type FieldSet } from "./field_set";
import { type ObjectMap } from "./object_map";
import { objectToQueryParamString } from "./object_to_query_param_string";
import {
  paramValidators,
  type QueryParams,
  shouldListRecordsParamBePassedAsParameter,
  URL_CHARACTER_LENGTH_LIMIT,
} from "./query_params";
import { Record, type RecordJson } from "./record";
import { type Records } from "./records";
import { type Table } from "./table";

/**
 * Builds a query object. Won't fetch until `firstPage` or
 * or `eachPage` is called.
 *
 * Params should be validated prior to being passed to Query
 * with `Query.validateParams`.
 */
export class Query<TFields extends FieldSet> {
  public static paramValidators = paramValidators;

  constructor(
    public readonly table: Table<TFields>,
    public readonly params: QueryParams<TFields>,
    public readonly fetchOptions: RegisteredFetchOptions = {},
  ) {}

  /**
   * Validates the parameters for passing to the Query constructor.
   *
   * @param params parameters to validate
   *
   * @returns an object with three keys:
   *  validParams: the object that should be passed to the constructor.
   *  ignoredKeys: a list of keys that will be ignored.
   *  errors: a list of error messages.
   */
  public static validateParams<TFields extends FieldSet, Params extends QueryParams<TFields> = QueryParams<TFields>>(
    params: Params,
  ): {
    errors: string[];
    ignoredKeys: string[];
    validParams: QueryParams<TFields>;
  } {
    const validParams: QueryParams<TFields> = {};
    const ignoredKeys = [];
    const errors = [];

    for (const [key, value] of Object.entries(params)) {
      if (key in Query.paramValidators) {
        const validator = Query.paramValidators[key as keyof QueryParams<TFields>];
        const validationResult = validator(value as never);
        if (validationResult.pass) {
          validParams[key as never] = value as never;
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

  /**
   * Fetches the first page of results for the query asynchronously,
   * then calls `done(error, records)`.
   */
  public async firstPage(): Promise<Records<TFields>> {
    for await (const records of this.eachPage()) {
      return records;
    }

    return [];
  }

  /**
   * Fetches each page of results for the query asynchronously.
   */
  public async *eachPage() {
    const params = { ...this.params } as ObjectMap<string, unknown>;
    const pathAndParamsAsString = `/${this.table._urlEncodedNameOrId()}?${objectToQueryParamString(params)}`;

    let queryParams = {} as ObjectMap<string, unknown>;
    let requestData = null;
    let method: "get" | "post";
    let path;

    if (params.method === "post" || pathAndParamsAsString.length > URL_CHARACTER_LENGTH_LIMIT) {
      // There is a 16kb limit on GET requests. Since the URL makes up nearly all of the request size, we check for any requests that
      // that come close to this limit and send it as a POST instead. Additionally, we'll send the request as a post if it is specified
      // with the request params

      requestData = params;
      method = "post";
      path = `/${this.table._urlEncodedNameOrId()}/listRecords`;

      const paramNames = Object.keys(params);

      for (const paramName of paramNames) {
        if (shouldListRecordsParamBePassedAsParameter(paramName)) {
          // timeZone and userLocale is parsed from the GET request separately from the other params. This parsing
          // does not occurring within the body parser we use for POST requests, so this will still need to be passed
          // via query params
          queryParams[paramName] = params[paramName];
        } else {
          requestData[paramName] = params[paramName];
        }
      }
    } else {
      method = "get";
      queryParams = params;
      path = `/${this.table._urlEncodedNameOrId()}`;
    }

    let offset;

    do {
      const result = await this.table.base.makeRequest(
        {
          method,
          path,
          qs: queryParams,
          body: requestData,
        },
        this.fetchOptions,
      );

      const body = result.body as { offset?: string; records: Array<RecordJson<TFields>> };
      if (body.offset) {
        params.offset = offset = body.offset;
        yield body.records.map(recordJson => {
          return new Record<TFields>(this.table, recordJson.id, recordJson);
        });
      } else break;
    } while (offset);

    return null;
  }

  /**
   * Fetches all pages of results asynchronously. May take a long time.
   */
  public async all(): Promise<Records<TFields>> {
    const allRecords = [];
    for await (const pageRecords of this.eachPage()) {
      allRecords.push(...pageRecords);
    }
    return allRecords;
  }
}
