import nock from 'nock'
import * as RecordsServer from './records.server'

const BASE_ID = 'abc'
const TABLE_NAME = 'My Table'
const API_VERSION = '0'
const API_KEY = 'key123'
const TABLE_PATH = `/v${API_VERSION}/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`

export function start(): RecordsServer.ScopeAndPath {
  const scope = nock('http://localhost').matchHeader('Authorization', `Bearer ${API_KEY}`)

  return { scope, path: TABLE_PATH }
}
