import axios, { AxiosError } from 'axios'
import { createError } from './error'
import { BaseOptions } from './base'
import * as rax from 'retry-axios'
import qs from 'qs'
import {
  QueryParams,
  TableRecord,
  CreateRecordsInput,
  UpdateRecordsInput,
  DeleteRecordsInput,
  TableRecordReponse,
  DeleteTableRecordResponse,
  UpdatedTableRecordResponse,
  CreatedTableRecordReponse,
} from './types/table.types'

rax.attach(axios)

export type TableOptions = BaseOptions & {
  baseId: string
}

export default class Table {
  constructor(readonly name: string, private readonly options: TableOptions) {}
  private get baseUrl() {
    return `${this.options.endpointUrl}/v${this.options.apiVersionMajor}/${encodeURIComponent(
      this.options.baseId
    )}/${encodeURIComponent(this.name)}`
  }

  async records(params: QueryParams = {}, offset?: string): Promise<TableRecordReponse> {
    try {
      const { data } = await axios.get<TableRecordReponse>(this.baseUrl, {
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        params: offset ? { offset, ...params } : params,
        paramsSerializer: (param) => qs.stringify(param),
        raxConfig: {
          retry: 3,
        },
      })
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status!, response?.statusText!)
    }
  }

  async *list(params: QueryParams = {}): AsyncGenerator<TableRecord[], void, unknown> {
    let result = await this.records(params)
    yield result.records

    while (result?.offset) {
      result = await this.records(params, result?.offset)
      yield result.records
    }
  }

  async findRecord(id: string): Promise<TableRecord> {
    try {
      const { data } = await axios.get<TableRecord>(`${this.baseUrl}/${id}`, {
        timeout: this.options.requestTimeout,
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        raxConfig: {
          retry: 3,
        },
      })
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status!, response?.statusText!)
    }
  }

  async createRecords(records: CreateRecordsInput): Promise<CreatedTableRecordReponse> {
    try {
      const { data } = await axios.post<CreatedTableRecordReponse>(`${this.baseUrl}`, records, {
        timeout: this.options.requestTimeout,
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        raxConfig: {
          retry: 3,
        },
      })
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status!, response?.statusText!)
    }
  }

  async updateRecords(records: UpdateRecordsInput): Promise<UpdatedTableRecordResponse> {
    try {
      const { data } = await axios.patch<UpdatedTableRecordResponse>(`${this.baseUrl}`, records, {
        timeout: this.options.requestTimeout,
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        raxConfig: {
          retry: 3,
        },
      })
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status!, response?.statusText!)
    }
  }

  async deleteRecords(records: DeleteRecordsInput): Promise<DeleteTableRecordResponse> {
    try {
      const { data } = await axios.delete<DeleteTableRecordResponse>(`${this.baseUrl}`, {
        timeout: this.options.requestTimeout,
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
        },
        raxConfig: {
          retry: 3,
        },
        data: records,
      })
      return data
    } catch (error) {
      const { response } = error as AxiosError
      throw createError(response?.status!, response?.statusText!)
    }
  }
}
