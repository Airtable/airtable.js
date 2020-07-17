// var Record = require('./record');
// var Table = require('./table');
// var AirtableError = require('./airtable_error');
import Base from './base'
import { merge } from 'lodash'

export interface AirtableConfig {
  endpointUrl: string
  apiVersion: string
  apiKey: string
  // noRetryIfRateLimited: boolean
  requestTimeout: number
}

export type AirtableOptions = Partial<Omit<AirtableConfig, 'apiVersion'>>

export default class Airtable {
  static Base = Base

  static apiVersion?: string
  static endpointUrl?: string
  static apiKey?: string
  static apiVersionMajor?: string
  static noRetryIfRateLimited?: boolean
  static requestTimeout?: number

  private options?: AirtableOptions

  /**
   * Returns the default configuration for Airtable
   */
  static defaultConfig = (): Partial<AirtableConfig> => ({
    endpointUrl: process?.env?.AIRTABLE_ENDPOINT_URL || 'https://api.airtable.com',
    apiVersion: '0.1.0',
    apiKey: process?.env?.AIRTABLE_API_KEY,
    // noRetryIfRateLimited: false,
    requestTimeout: 300 * 1000, // 5 minutes
  })

  constructor(options?: AirtableOptions) {
    this.configure(merge(Airtable.defaultConfig(), options))

    if (!Airtable.apiKey && !this.options?.apiKey) {
      throw new Error('An API key is required to connect to Airtable')
    }
  }

  /**
   * Configures Airtable API
   * @param options The options to configure Airtable
   * @returns An instance of `Airtable`
   */
  configure(options: AirtableOptions): Airtable {
    this.options = options
    Airtable.configure(options)
    return this
  }

  /**
   * Configures Airtable API
   * @param options The options to configure Airtable
   */
  static configure(options: AirtableOptions) {
    const {
      apiVersion,
      endpointUrl,
      apiKey,
      // noRetryIfRateLimited,
      requestTimeout,
    } = Airtable.defaultConfig()

    Airtable.apiKey = Airtable.apiKey || options?.apiKey || apiKey
    Airtable.endpointUrl = Airtable.endpointUrl || options?.endpointUrl || endpointUrl
    Airtable.apiVersion = Airtable.apiVersion || apiVersion
    Airtable.apiVersionMajor = Airtable.apiVersionMajor || apiVersion?.split('.')[0]
    Airtable.requestTimeout = Airtable.requestTimeout || options?.requestTimeout || requestTimeout
    return options
  }
  /**
   * Returns an instance of `Base`
   * @param id The base id
   */
  base(id: string) {
    return new Base(id, { ...this.options, apiVersionMajor: Airtable.apiVersionMajor! })
  }
  /**
   * Returns an instance of `Base`
   * @param id The base id
   */
  static base(id: string) {
    const { endpointUrl, apiKey, requestTimeout } = Airtable
    return new Airtable({
      endpointUrl,
      apiKey: apiKey || '',
      // noRetryIfRateLimited,
      requestTimeout,
    }).base(id)
  }
}
