import { AirtableError } from "./airtable_error";
import { type Attachment as AirtableAttachment } from "./attachment";
import { Base as AirtableBase } from "./base";
import { type Collaborator as AirtableCollaborator } from "./collaborator";
import { type FieldSet as AirtableFieldSet } from "./field_set";
import { type ObjectMap } from "./object_map";
import { type Query as AirtableQuery } from "./query";
import { type QueryParams as AirtableSelectOptions } from "./query_params";
import { Record as AirtableRecord } from "./record";
import { type RecordData as AirtableRecordData } from "./record_data";
import { type Records as AirtableRecords } from "./records";
import { Table as AirtableTable } from "./table";
import { type Thumbnail as AirtableThumbnail } from "./thumbnail";

type CustomHeaders = ObjectMap<string, string>;

const defaultConfig: Required<Airtable.AirtableOptions> = {
  endpointUrl: process.env.AIRTABLE_ENDPOINT_URL || "https://api.airtable.com",
  apiVersion: "0.1.0",
  apiKey: process.env.AIRTABLE_API_KEY ?? "",
  noRetryIfRateLimited: false,
  requestTimeout: 300 * 1000, // 5 minutes
  fetch,
  customHeaders: {},
};

class Airtable {
  public readonly apiKey: string;
  public readonly apiVersion: string;
  public readonly apiVersionMajor: string;
  public readonly customHeaders: CustomHeaders;
  public readonly endpointUrl: string;
  public readonly noRetryIfRateLimited: boolean;
  public readonly requestTimeout: number;
  public readonly fetch: Airtable.RegisteredFetch;

  public static readonly Base = AirtableBase;
  public static readonly Record = AirtableRecord;
  public static readonly Table = AirtableTable;
  public static readonly Error = AirtableError;

  public static apiKey = defaultConfig.apiKey;
  public static apiVersion = defaultConfig.apiVersion;
  public static endpointUrl = defaultConfig.endpointUrl;
  public static noRetryIfRateLimited = defaultConfig.noRetryIfRateLimited;
  public static requestTimeout = defaultConfig.requestTimeout;
  public static fetch = defaultConfig.fetch;
  public static customHeaders = defaultConfig.customHeaders;

  constructor(opts: Airtable.AirtableOptions = {}) {
    const defaultConfig = Airtable.default_config();

    const apiVersion = opts.apiVersion || Airtable.apiVersion || defaultConfig.apiVersion;

    this.apiKey = opts.apiKey || Airtable.apiKey || defaultConfig.apiKey;
    this.apiVersion = apiVersion;
    this.apiVersionMajor = apiVersion.split(".")[0];
    this.customHeaders = opts.customHeaders || Airtable.customHeaders || defaultConfig.customHeaders;
    this.endpointUrl = opts.endpointUrl || Airtable.endpointUrl || defaultConfig.endpointUrl;
    this.noRetryIfRateLimited =
      opts.noRetryIfRateLimited || Airtable.noRetryIfRateLimited || defaultConfig.noRetryIfRateLimited;
    this.requestTimeout = opts.requestTimeout || Airtable.requestTimeout || defaultConfig.requestTimeout;
    this.fetch = opts.fetch || Airtable.fetch || defaultConfig.fetch;

    if (!this.apiKey) {
      throw new Error("An API key is required to connect to Airtable");
    }
  }

  public base(baseId: string): Airtable.Base {
    return new AirtableBase(this, baseId);
  }

  public static default_config(): Required<Airtable.AirtableOptions> {
    return {
      ...defaultConfig,
      endpointUrl: process.env.AIRTABLE_ENDPOINT_URL || defaultConfig.endpointUrl,
      apiKey: process.env.AIRTABLE_API_KEY ?? defaultConfig.apiKey,
    };
  }

  public static configure({
    apiKey,
    endpointUrl,
    apiVersion,
    noRetryIfRateLimited,
    requestTimeout,
    fetch,
    customHeaders,
  }: Airtable.AirtableOptions): void {
    Airtable.apiKey = apiKey || Airtable.apiKey;
    Airtable.endpointUrl = endpointUrl || Airtable.endpointUrl;
    Airtable.apiVersion = apiVersion || Airtable.apiVersion;
    Airtable.noRetryIfRateLimited = noRetryIfRateLimited || Airtable.noRetryIfRateLimited;
    Airtable.requestTimeout = requestTimeout || Airtable.requestTimeout;
    Airtable.fetch = fetch || Airtable.fetch;
    Airtable.customHeaders = customHeaders || Airtable.customHeaders;
  }

  public static base(baseId: string): Airtable.Base {
    return new Airtable().base(baseId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Airtable {
  export interface AirtableOptions {
    apiKey?: string;
    apiVersion?: string;
    customHeaders?: CustomHeaders;
    endpointUrl?: string;
    fetch?: RegisteredFetch;
    noRetryIfRateLimited?: boolean;
    requestTimeout?: number;
  }

  export type FieldSet = AirtableFieldSet;
  export type Collaborator = AirtableCollaborator;
  export type Attachment = AirtableAttachment;
  export type Thumbnail = AirtableThumbnail;

  export type Base = AirtableBase;
  export type Error = AirtableError;
  export type Table<TFields extends AirtableFieldSet> = AirtableTable<TFields>;
  export type SelectOptions<TFields> = AirtableSelectOptions<TFields>;
  export type Query<TFields extends AirtableFieldSet> = AirtableQuery<TFields>;
  export type Record<TFields extends AirtableFieldSet> = AirtableRecord<TFields>;
  export type RecordData<TFields extends AirtableFieldSet> = AirtableRecordData<TFields>;
  export type Records<TFields extends AirtableFieldSet> = AirtableRecords<TFields>;

  /**
   * Add a custom fetch implementation to the Airtable module.
   *
   * To register a custom fetch implementation, you must provide a `fetch` function that
   * behaves like the native `fetch` function. This function will be used to make requests
   * to the Airtable API.
   *
   * @example
   * ```typescript
   * import Airtable from 'airtable';
   *
   * declare "@lsagetlethias/airtable" {
   *  namespace Airtable {
   *   interface RegisterFetch {
   *    fetch: typeof myCustomFetch;
   *   }
   *  }
   * }
   *
   * Airtable.configure({
   *   fetch: myCustomFetch,
   * });
   * ```
   */
  export interface RegisterFetch {}
  export type RegisteredFetch = RegisterFetch extends { fetch: infer TFetch extends typeof fetch }
    ? TFetch
    : typeof fetch;
  export type RegisteredFetchOptions = Parameters<RegisteredFetch>[1];
}

export = Airtable;
