export type SortField = {
  field: string
  direction?: 'desc' | 'asc'
}

export type QueryParams = {
  fields?: string[]
  filterByFormula?: string
  maxRecords?: number
  pageSize?: number
  sort?: SortField[]
  view?: string
  cellFormat?: string
  timeZone?: string
  userLocal?: string
}

export type Field<T> = T extends unknown
  ? T
  : {
      [x: string]: unknown
    }

export type Record<T> = {
  id: string
  fields: Field<T>
  createdTime: string
}

export type CreateRecordInput<T> = {
  fields: Field<T>
}

export type CreateRecordsInput<T> = Array<{
  fields: Field<T>
}>

export type UpdateRecordInput<T> = {
  id: string
  fields: Field<T>
}

export type UpdateRecordsInput<T> = Array<{
  id: string
  fields: Field<T>
}>

export type DeleteRecordInput = string

export type DeleteRecordsInput = string[]

export type TableRecordResponse<T> = {
  records: Record<T>[]
  offset?: string
}

export type CreatedRecordResponse<T> = Omit<TableRecordResponse<T>, 'offset'>

export type UpdatedRecordResponse<T> = Omit<TableRecordResponse<T>, 'offset'>

export type DeleteRecordResponse = {
  records: Array<{
    id: string
    deleted: boolean
  }>
}
