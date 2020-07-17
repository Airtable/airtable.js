import { AirtableOptions } from './airtable'
import Table from './table'
export type BaseOptions = AirtableOptions & {
  apiVersionMajor: string
}

export default class Base {
  #options: BaseOptions
  constructor(readonly id: string, options: BaseOptions) {
    this.#options = options
  }

  table(name: string): Table {
    return new Table(name, {
      baseId: this.id,
      ...this.#options,
    })
  }
}
