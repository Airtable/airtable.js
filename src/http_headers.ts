import forEach from 'lodash/forEach';

const isBrowser = typeof window !== 'undefined';

class HttpHeaders {
    _headersByLowercasedKey;

    constructor() {
        this._headersByLowercasedKey = {};
    }

    set(headerKey, headerValue) {
        let lowercasedKey = headerKey.toLowerCase();

        if (lowercasedKey === 'x-airtable-user-agent') {
            lowercasedKey = 'user-agent';
            headerKey = 'User-Agent';
        }

        this._headersByLowercasedKey[lowercasedKey] = {
            headerKey,
            headerValue,
        };
    }

    toJSON() {
        const result = {};
        forEach(this._headersByLowercasedKey, (headerDefinition, lowercasedKey) => {
            let headerKey;
            /* istanbul ignore next */
            if (isBrowser && lowercasedKey === 'user-agent') {
                // Some browsers do not allow overriding the user agent.
                // https://github.com/Airtable/airtable.js/issues/52
                headerKey = 'X-Airtable-User-Agent';
            } else {
                headerKey = headerDefinition.headerKey;
            }

            result[headerKey] = headerDefinition.headerValue;
        });
        return result;
    }
}

export = HttpHeaders;
