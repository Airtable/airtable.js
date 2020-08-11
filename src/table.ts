import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { createError } from './error'
import { BaseOptions } from './base'
import * as rax from 'retry-axios'
import qs from 'qs'
import {
  QueryParams,
  Record,
  CreateRecordsInput,
  UpdateRecordsInput,
  DeleteRecordsInput,
  TableRecordResponse,
  DeleteRecordResponse,
  UpdatedRecordResponse,
  CreatedRecordResponse,
  CreateRecordInput,
  UpdateRecordInput,
  DeleteRecordInput,
} from './types'

rax.attach(axios)

export type TableOptions = BaseOptions & {
  baseId: string
}

export default class Table {
  #axiosConfig: AxiosRequestConfig
  /**
   * Creates an instance of Table
   * @param name The name of the table to access
   * @param options
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   */
  constructor(readonly name: string, private readonly options: TableOptions) {
    this.#axiosConfig = {
      timeout: this.options.requestTimeout,
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      raxConfig: {
        retry: 3,
      },
    }
  }

  private get baseUrl() {
    return `${this.options.endpointUrl}/v${this.options.apiVersionMajor}/${encodeURIComponent(
      this.options.baseId
    )}/${encodeURIComponent(this.name)}`
  }

  /**
   * Retrieves the list of records in the table
   * @param params Parameters to query the API
   * @param offset The offset for the next set of records to fetch
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Fetch the records
   * await table.records()
   */
  async records<T = unknown>(
    params: QueryParams = {},
    offset?: string
  ): Promise<TableRecordResponse<T>> {
    try {
      const { data } = await axios.get<TableRecordResponse<T>>(this.baseUrl, {
        ...this.#axiosConfig,
        params: offset ? { offset, ...params } : params,
        paramsSerializer: (param) => qs.stringify(param),
      })
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status, response?.statusText)
    }
  }

  /**
   * Automatically paginates and retrieves a list of records
   * @param params Parameters to query the API
   * @example
   *
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Fetch ten records and iterate until the end or until a condition is met.
   * for await (const record in table.list({ maxResult: 10 })) {
   *  if (record.id === 'MY_RECORD_ID) {
   *    // ...
   *    break;
   *  }
   * }
   */
  async *list<T = unknown>(params: QueryParams = {}): AsyncGenerator<Record<T>[], void, unknown> {
    let result = await this.records<T>(params)
    yield result.records

    while (result?.offset) {
      result = await this.records<T>(params, result?.offset)
      yield result.records
    }
  }

  /**
   * Searches a record in the table
   * @param id The id of the record
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Find the record
   * await table.findRecord('record_id')
   * ```
   */
  async findRecord<T = unknown>(id: string): Promise<Record<T>> {
    try {
      const { data } = await axios.get<Record<T>>(`${this.baseUrl}/${id}`, this.#axiosConfig)
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status, response?.statusText)
    }
  }

  /**
   * Creates a single record in the table
   * @param records The record to create
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Create the record
   * await table.createRecord({
   *  fields: {
   *    "Name": "Coffee Deluxe",
   *    "Price": "$0.00"
   *  }
   * })
   */
  async createRecord<T = unknown, U = unknown>(
    record: CreateRecordInput<T>
  ): Promise<CreatedRecordResponse<U>> {
    return this.createRecords([record])
  }

  /**
   * Creates a batch of records in the table
   * @param records The records to create
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Create the record
   * await table.createRecords([{
   *  fields: {
   *    "Name": "Coffee Deluxe",
   *    "Price": "$0.00"
   *  }
   * }, {
   *  fields: {
   *    "Name": "Coffee Max",
   *    "Price": "$0.00"
   *  }
   * }])
   */
  async createRecords<T = unknown, U = unknown>(
    records: CreateRecordsInput<T>
  ): Promise<CreatedRecordResponse<U>> {
    try {
      const { data } = await axios.post<CreatedRecordResponse<U>>(
        `${this.baseUrl}`,
        records,
        this.#axiosConfig
      )
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status, response?.statusText)
    }
  }

  /**
   * Updates a single record in the table
   * @param records The record to update
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Create the record
   * await table.updateRecord({
   *  id: 'record_id',
   *  fields: {
   *    "Name": "Coffee Deluxe",
   *    "Price": "$0.00"
   *  }
   * })
   *
   */
  async updateRecord<T = unknown, U = unknown>(
    record: UpdateRecordInput<T>
  ): Promise<CreatedRecordResponse<U>> {
    return this.updateRecords([record])
  }

  /**
   * Updates a batch of records in the table
   * @param records The records to update
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Update the records
   * await table.updateRecords([{
   * id: 'record_id'
   *  fields: {
   *    "Name": "Coffee Deluxe",
   *    "Price": "$0.00"
   *  }
   * }, {
   * id: 'record_id_2'
   *  fields: {
   *    "Name": "Coffee Max",
   *    "Price": "$0.00"
   *  }
   * }])
   */
  async updateRecords<T = unknown, U = unknown>(
    records: UpdateRecordsInput<T>
  ): Promise<UpdatedRecordResponse<U>> {
    try {
      const { data } = await axios.patch<UpdatedRecordResponse<U>>(
        `${this.baseUrl}`,
        records,
        this.#axiosConfig
      )
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status, response?.statusText)
    }
  }

  /**
   * Removes a single record from the table.
   * @param record The record to delete
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Delete the records
   * await table.deleteRecord('record_id')
   */
  async deleteRecord(record: DeleteRecordInput): Promise<DeleteRecordResponse> {
    return this.deleteRecords([record])
  }

  /**
   * Removes a batch of records from the table.
   * @param records The records to delete
   * @example
   *
   * // Create the base
   * const base = Airtable({ apiKey: 'MY_API_KEY' }).base('BASE_ID')
   * // Create the table
   * const table = base.table('My Table')
   * // Delete the records
   * await table.deleteRecords(['record_id', 'record_id_2'])
   */
  async deleteRecords(records: DeleteRecordsInput): Promise<DeleteRecordResponse> {
    try {
      const { data } = await axios.delete<DeleteRecordResponse>(`${this.baseUrl}`, {
        ...this.#axiosConfig,
        data: records,
      })
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status, response?.statusText)
    }
  }
}
