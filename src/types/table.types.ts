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

export type Field = Record<string, any>

export type TableRecord = {
  id: string
  fields: Field[]
  createdTime: string
}

export type CreateRecordsInput = Array<{
  fields: Field
}>

export type UpdateRecordsInput = Array<{
  id: string
  fields: Field
}>

export type DeleteRecordsInput = string[]

export type TableRecordReponse = {
  records: TableRecord[]
  offset?: string
}

export type CreatedTableRecordReponse = Omit<TableRecordReponse, 'offset'>

export type UpdatedTableRecordResponse = Omit<TableRecordReponse, 'offset'>

export type DeleteTableRecordResponse = {
  records: Array<{
    id: string
    delete: boolean
  }>
}
