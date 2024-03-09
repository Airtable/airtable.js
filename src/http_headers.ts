import { keys } from "lodash";

export class HttpHeaders {
  public _headersByLowercasedKey: Record<
    string,
    {
      headerKey: string;
      headerValue: string;
    }
  > = {};

  public set(headerKey: string, headerValue: string): void {
    let lowercasedKey = headerKey.toLowerCase();

    if (lowercasedKey === "x-airtable-user-agent") {
      lowercasedKey = "user-agent";
      headerKey = "User-Agent";
    }

    this._headersByLowercasedKey[lowercasedKey] = {
      headerKey,
      headerValue,
    };
  }

  public toJSON(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const lowercasedKey of keys(this._headersByLowercasedKey)) {
      const headerDefinition = this._headersByLowercasedKey[lowercasedKey];

      result[headerDefinition.headerKey] = headerDefinition.headerValue;
    }
    return result;
  }
}
