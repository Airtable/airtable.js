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

export type Field = {
  [x: string]: unknown
}

export type Record = {
  id: string
  fields: Field[]
  createdTime: string
}

export type CreateRecordInput = {
  fields: Field
}

export type CreateRecordsInput = Array<{
  fields: Field
}>

export type UpdateRecordInput = {
  id: string
  fields: Field
}

export type UpdateRecordsInput = Array<{
  id: string
  fields: Field
}>

export type DeleteRecordInput = string

export type DeleteRecordsInput = string[]

export type TableRecordResponse = {
  records: Record[]
  offset?: string
}

export type CreatedRecordResponse = Omit<TableRecordResponse, 'offset'>

export type UpdatedRecordResponse = Omit<TableRecordResponse, 'offset'>

export type DeleteRecordResponse = {
  records: Array<{
    id: string
    deleted: boolean
  }>
}
