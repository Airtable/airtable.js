import Base from './base';
import AirtableRecord from './record';
import AirtableTable from './table';
import AirtableError from './airtable_error';
import AirtableQuery from './query';
import {AirtableBase} from './airtable_base';
import {ObjectMap} from './object_map';
import {FieldSet as AirtableFieldSet} from './field_set';
import {Collaborator as AirtableCollaborator} from './collaborator';
import {Thumbnail as AirtableThumbnail} from './thumbnail';
import {Attachment as AirtableAttachment} from './attachment';
import {Records as AirtableRecords} from './records';
import {RecordData as AirtableRecordData} from './record_data';
import {QueryParams as AirtableSelectOptions} from './query_params';

type CustomHeaders = ObjectMap<string, string | number | boolean>;

class Airtable {
    readonly _apiKey: string;
    readonly _apiVersion: string;
    readonly _apiVersionMajor: string;
    readonly _customHeaders: CustomHeaders;
    readonly _endpointUrl: string;
    readonly _noRetryIfRateLimited: boolean;
    readonly _requestTimeout: number;

    static Base = Base;
    static Record = AirtableRecord;
    static Table = AirtableTable;
    static Error = AirtableError;

    static apiKey: string;
    static apiVersion: string;
    static endpointUrl: string;
    static noRetryIfRateLimited: boolean;
    static requestTimeout: number;

    constructor(opts: Airtable.AirtableOptions = {}) {
        const defaultConfig = Airtable.default_config();

        const apiVersion = opts.apiVersion || Airtable.apiVersion || defaultConfig.apiVersion;

        Object.defineProperties(this, {
            _apiKey: {
                value: opts.apiKey || Airtable.apiKey || defaultConfig.apiKey,
            },
            _apiVersion: {
                value: apiVersion,
            },
            _apiVersionMajor: {
                value: apiVersion.split('.')[0],
            },
            _customHeaders: {
                value: opts.customHeaders || {},
            },
            _endpointUrl: {
                value: opts.endpointUrl || Airtable.endpointUrl || defaultConfig.endpointUrl,
            },
            _noRetryIfRateLimited: {
                value:
                    opts.noRetryIfRateLimited ||
                    Airtable.noRetryIfRateLimited ||
                    defaultConfig.noRetryIfRateLimited,
            },
            _requestTimeout: {
                value:
                    opts.requestTimeout || Airtable.requestTimeout || defaultConfig.requestTimeout,
            },
        });

        if (!this._apiKey) {
            throw new Error('An API key is required to connect to Airtable');
        }
    }

    base(baseId: string): Airtable.Base {
        return Base.createFunctor(this, baseId);
    }

    static default_config(): Airtable.AirtableOptions {
        return {
            endpointUrl: process.env.AIRTABLE_ENDPOINT_URL || 'https://api.airtable.com',
            apiVersion: '0.1.0',
            apiKey: process.env.AIRTABLE_API_KEY,
            noRetryIfRateLimited: false,
            requestTimeout: 300 * 1000, // 5 minutes
        };
    }

    static configure({
        apiKey,
        endpointUrl,
        apiVersion,
        noRetryIfRateLimited,
        requestTimeout,
    }: Pick<
        Airtable.AirtableOptions,
        'apiKey' | 'endpointUrl' | 'apiVersion' | 'noRetryIfRateLimited' | 'requestTimeout'
    >): void {
        Airtable.apiKey = apiKey;
        Airtable.endpointUrl = endpointUrl;
        Airtable.apiVersion = apiVersion;
        Airtable.noRetryIfRateLimited = noRetryIfRateLimited;
        Airtable.requestTimeout = requestTimeout;
    }

    static base(baseId: string): Airtable.Base {
        return new Airtable().base(baseId);
    }
}

/* eslint-disable no-redeclare, @typescript-eslint/no-namespace */
namespace Airtable {
    /* eslint-enable no-redeclare, @typescript-eslint/no-namespace */
    export interface AirtableOptions {
        apiKey?: string;
        apiVersion?: string;
        customHeaders?: CustomHeaders;
        endpointUrl?: string;
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
}

export = Airtable;
