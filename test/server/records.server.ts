import nock, { Scope } from 'nock'
import qs from 'qs'
import recordsResponse from '../fixtures/records.json'
import filterByFormulaResponse from '../fixtures/records.filterbyformula.json'
import pageSizeResponse from '../fixtures/records.pageSize-1.json'
import offset1Response from '../fixtures/records.pageSize-1-offset-1.json'
import offset2Resopnse from '../fixtures/records.pageSize-1-offset-2.json'
import sortResponse from '../fixtures/records.sort.json'
import createRequestBody from '../fixtures/records.create.json'
import updateRequestBody from '../fixtures/records.update.json'
import { matches } from 'lodash'
import { QueryParams } from '../../src/types'

const BASE_ID = 'abc'
const TABLE_NAME = 'My Table'
const API_VERSION = '0'
const API_KEY = 'key123'
const TABLE_PATH = `/v${API_VERSION}/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`
function checkQuery(query: QueryParams) {
  return (param) => qs.stringify(param) === qs.stringify(query)
}

export type ScopeAndPath = { scope: Scope; path: string }

export function start(): ScopeAndPath {
  const scope = nock('http://localhost').matchHeader('Authorization', `Bearer ${API_KEY}`)
  // TODO: Once the pipeline operator lands in JS, convert this to:
  // allRecords(...)
  // | queryRecords
  // | ...

  return deleteRecords(
    updateRecords(
      createRecords(
        deleteRecord(
          updateRecord(
            createRecord(findRecord(paginatedRecords(queryRecords(allRecords(scope, TABLE_PATH)))))
          )
        )
      )
    )
  )
}

// Return all records
export function allRecords(scope: Scope, path: string): ScopeAndPath {
  scope.get(path).reply(200, recordsResponse)
  return {
    scope,
    path,
  }
}

// Query records
export function queryRecords({ scope, path }: ScopeAndPath): ScopeAndPath {
  scope

    // fields
    .get(path)
    .query(checkQuery({ fields: ['Name', 'Client'] }))
    .reply(200, {
      records: recordsResponse.records.map((record) => {
        return {
          Name: record.fields.Name,
          Client: record.fields.Client,
        }
      }),
    })

    // filterByFormula
    .get(path)
    .query({ filterByFormula: "NOT({Name} = ''" })
    .reply(200, filterByFormulaResponse)

    // maxRecords
    .get(path)
    .query({ maxRecords: 3 } as QueryParams)
    .reply(200, { records: recordsResponse.records.slice(0, 3), offset: 'offset_123' })

    // pageSize
    .get(path)
    .query({ pageSize: 1 })
    .reply(200, pageSizeResponse)

    // sort
    .get(path)
    .query(checkQuery({ sort: [{ field: 'Name', direction: 'desc' }] }))
    .reply(200, sortResponse)

  // TODO: view

  // TODO: cellFormat

  // TODO: timeZone

  // TODO: user locale
  return { scope, path }
}

// Auto-paginate records (test)
export function paginatedRecords({ scope, path }: ScopeAndPath): ScopeAndPath {
  const params = { pageSize: 1 }
  scope
    .get(path)
    .query(params)
    .reply(200, pageSizeResponse)
    .get(path)
    .query({ ...params, offset: pageSizeResponse.offset })
    .reply(200, offset1Response)
    .get(path)
    .query({ ...params, offset: offset1Response.offset })
    .reply(200, offset2Resopnse)

  return {
    scope,
    path,
  }
}

export function findRecord({ scope, path }: ScopeAndPath): ScopeAndPath {
  scope.get(`${path}/recABcLKRaQWszKp`).reply(200, () => {
    return recordsResponse.records.filter((record) => record.id === 'recABcLKRaQWszKp')[0]
  })
  return { scope, path }
}

export function createRecord({ scope, path }: ScopeAndPath): ScopeAndPath {
  scope.post(path, matches([createRequestBody[0]])).reply(200, { records: [createRequestBody[0]] })
  return { scope, path }
}

export function createRecords({ scope, path }: ScopeAndPath): ScopeAndPath {
  scope.post(path, matches(createRequestBody)).reply(200, { records: createRequestBody })
  return { scope, path }
}

export function updateRecord({ scope, path }: ScopeAndPath): ScopeAndPath {
  scope.patch(path, matches([updateRequestBody[0]])).reply(200, {
    records: [updateRequestBody[0]],
  })
  return { scope, path }
}

export function updateRecords({ scope, path }: ScopeAndPath): ScopeAndPath {
  scope.patch(path, matches(updateRequestBody)).reply(200, { records: updateRequestBody })
  return { scope, path }
}

export function deleteRecord({ scope, path }: ScopeAndPath): ScopeAndPath {
  const ids = ['recABcLKRaQWszKp']
  scope.delete(path, matches(ids)).reply(200, {
    records: recordsResponse.records.filter((record) => ids.includes(record.id)),
  })
  return { scope, path }
}

export function deleteRecords({ scope, path }: ScopeAndPath): ScopeAndPath {
  const ids = ['recABcLKRaQWszKp', 'recAtELIMS1xJOTI']
  scope.delete(path, matches(ids)).reply(200, {
    records: recordsResponse.records.filter((record) => ids.includes(record.id)),
  })
  return { scope, path }
}
