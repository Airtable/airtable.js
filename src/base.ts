import { get, isPlainObject, keys } from "lodash";

import { type default as Airtable, type RegisteredFetchOptions } from "./airtable";
import { AirtableError } from "./airtable_error";
import { exponentialBackoffWithJitter } from "./exponential_backoff_with_jitter";
import { type FieldSet } from "./field_set";
import { HttpHeaders } from "./http_headers";
import { type ObjectMap } from "./object_map";
import { objectToQueryParamString } from "./object_to_query_param_string";
import { version as packageVersion } from "./package_version";
import { Table } from "./table";

const userAgent = `@lsagetlethias/Airtable.js/${packageVersion}`;

type Method = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
interface BaseRequestOptions {
  _numAttempts?: number;
  body?: unknown;
  headers?: ObjectMap<string, string>;
  method?: Lowercase<Method> | Method;
  path?: string;
  qs?: ObjectMap<string, unknown>;
}

interface BaseResponse {
  body: unknown;
  headers: Response["headers"];
  statusCode: Response["status"];
}

export class Base {
  constructor(
    public readonly airtable: Airtable,
    public readonly baseId: string,
  ) {}

  public table<TFields extends FieldSet>(tableName: string): Table<TFields> {
    return new Table<TFields>(this, void 0, tableName);
  }

  public makeRequest(
    options: BaseRequestOptions = {},
    fetchOptions: RegisteredFetchOptions = {},
  ): Promise<BaseResponse> {
    const method = (options.method ?? "GET").toUpperCase();

    const url = `${this.airtable.endpointUrl}/v${this.airtable.apiVersionMajor}/${
      this.baseId
    }${options.path ?? "/"}?${objectToQueryParamString(options.qs ?? {})}`;

    const controller = new AbortController();
    const headers = this._getRequestHeaders({
      ...this.airtable.customHeaders,
      ...(options.headers ?? {}),
    });

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
      ...fetchOptions,
    };

    if ("body" in options && _canRequestMethodIncludeBody(method)) {
      requestOptions.body = JSON.stringify(options.body);
    }

    const timeout = setTimeout(() => {
      controller.abort();
    }, this.airtable.requestTimeout);

    return new Promise((resolve, reject) => {
      this.airtable
        .fetch(url, requestOptions)
        .then((resp: Response) => {
          clearTimeout(timeout);
          if (resp.status === 429 && !this.airtable.noRetryIfRateLimited) {
            const numAttempts = get(options, "_numAttempts", 0);
            const backoffDelayMs = exponentialBackoffWithJitter(numAttempts);
            setTimeout(() => {
              const newOptions = {
                ...options,
                _numAttempts: numAttempts + 1,
              };
              this.makeRequest(newOptions).then(resolve).catch(reject);
            }, backoffDelayMs);
          } else {
            resp
              .json()
              .then(body => {
                const err =
                  this._checkStatusForError(resp.status, body) || _getErrorForNonObjectBody(resp.status, body);

                if (err) {
                  reject(err);
                } else {
                  resolve({
                    statusCode: resp.status,
                    headers: resp.headers,
                    body,
                  });
                }
              })
              .catch(() => {
                const err = _getErrorForNonObjectBody(resp.status);
                reject(err);
              });
          }
        })
        .catch((err: Error) => {
          clearTimeout(timeout);
          reject(new AirtableError("CONNECTION_ERROR", err.message));
        });
    });
  }

  public _getRequestHeaders(headers: { [key: string]: string }): { [key: string]: string } {
    const result = new HttpHeaders();

    result.set("Authorization", `Bearer ${this.airtable.apiKey}`);
    result.set("User-Agent", userAgent);
    result.set("Content-Type", "application/json");
    for (const headerKey of keys(headers)) {
      result.set(headerKey, headers[headerKey]);
    }

    return result.toJSON();
  }

  public _checkStatusForError(statusCode: number, body?: unknown): AirtableError | null {
    const { type, message } = get(body, "error", {}) as { message?: string; type?: string };

    if (statusCode === 401) {
      return new AirtableError(
        "AUTHENTICATION_REQUIRED",
        "You should provide valid api key to perform this operation",
        statusCode,
      );
    } else if (statusCode === 403) {
      return new AirtableError("NOT_AUTHORIZED", "You are not authorized to perform this operation", statusCode);
    } else if (statusCode === 404) {
      return new AirtableError("NOT_FOUND", message ?? "Could not find what you are looking for", statusCode);
    } else if (statusCode === 413) {
      return new AirtableError("REQUEST_TOO_LARGE", "Request body is too large", statusCode);
    } else if (statusCode === 422) {
      return new AirtableError(
        type ?? "UNPROCESSABLE_ENTITY",
        message ?? "The operation cannot be processed",
        statusCode,
      );
    } else if (statusCode === 429) {
      return new AirtableError(
        "TOO_MANY_REQUESTS",
        "You have made too many requests in a short period of time. Please retry your request later",
        statusCode,
      );
    } else if (statusCode === 500) {
      return new AirtableError("SERVER_ERROR", "Try again. If the problem persists, contact support.", statusCode);
    } else if (statusCode === 503) {
      return new AirtableError(
        "SERVICE_UNAVAILABLE",
        "The service is temporarily unavailable. Please retry shortly.",
        statusCode,
      );
    } else if (statusCode >= 400) {
      return new AirtableError(type ?? "UNEXPECTED_ERROR", message ?? "An unexpected error occurred", statusCode);
    } else {
      return null;
    }
  }

  public doCall<TFields extends FieldSet>(tableName: string): Table<TFields> {
    return this.table<TFields>(tableName);
  }

  public getId(): string {
    return this.baseId;
  }
}

function _canRequestMethodIncludeBody(method: string) {
  return method !== "GET" && method !== "DELETE";
}

function _getErrorForNonObjectBody(statusCode: number, body?: unknown) {
  if (isPlainObject(body)) {
    return null;
  } else {
    return new AirtableError(
      "UNEXPECTED_ERROR",
      "The response from Airtable was invalid JSON. Please try again soon.",
      statusCode,
    );
  }
}
