import Base from './base';
import Record from './record';
import Table from './table';
import AirtableError from './airtable_error';

class Airtable {
    readonly _apiKey: string;
    readonly _endpointUrl: string;
    readonly _apiVersion: string;
    readonly _apiVersionMajor: string;
    readonly _noRetryIfRateLimited: boolean;

    requestTimeout: number;

    static Base = Base;
    static Record = Record;
    static Table = Table;
    static Error = AirtableError;

    static apiKey: string;
    static apiVersion: string;
    static endpointUrl: string;
    static noRetryIfRateLimited: boolean;

    constructor(
        opts: {
            apiKey?: string;
            apiVersion?: string;
            endpointUrl?: string;
            requestTimeout?: number;
            noRetryIfRateLimited?: boolean;
        } = {}
    ) {
        const defaultConfig = Airtable.default_config();

        const apiVersion = opts.apiVersion || Airtable.apiVersion || defaultConfig.apiVersion;

        Object.defineProperties(this, {
            _apiKey: {
                value: opts.apiKey || Airtable.apiKey || defaultConfig.apiKey,
            },
            _endpointUrl: {
                value: opts.endpointUrl || Airtable.endpointUrl || defaultConfig.endpointUrl,
            },
            _apiVersion: {
                value: apiVersion,
            },
            _apiVersionMajor: {
                value: apiVersion.split('.')[0],
            },
            _noRetryIfRateLimited: {
                value:
                    opts.noRetryIfRateLimited ||
                    Airtable.noRetryIfRateLimited ||
                    defaultConfig.noRetryIfRateLimited,
            },
        });

        this.requestTimeout = opts.requestTimeout || defaultConfig.requestTimeout;

        if (!this._apiKey) {
            throw new Error('An API key is required to connect to Airtable');
        }
    }

    base(baseId: string) {
        return Base.createFunctor(this, baseId);
    }

    static default_config() {
        return {
            endpointUrl: process.env.AIRTABLE_ENDPOINT_URL || 'https://api.airtable.com',
            apiVersion: '0.1.0',
            apiKey: process.env.AIRTABLE_API_KEY,
            noRetryIfRateLimited: false,
            requestTimeout: 300 * 1000, // 5 minutes
        };
    }

    static configure({apiKey, endpointUrl, apiVersion, noRetryIfRateLimited}) {
        Airtable.apiKey = apiKey;
        Airtable.endpointUrl = endpointUrl;
        Airtable.apiVersion = apiVersion;
        Airtable.noRetryIfRateLimited = noRetryIfRateLimited;
    }

    static base(baseId: string) {
        return new Airtable().base(baseId);
    }
}

export = Airtable;
