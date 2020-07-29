import Airtable from '../src/airtable'
import createRequestBody from './fixtures/records.create.json'
import updateRequestBody from './fixtures/records.update.json'
import { start } from './server/error.server'
import nock from 'nock'

const BASE_ID = 'abc'
const TABLE_NAME = 'My Table'
const API_KEY = 'key123'

const API_VERSION = '0'
const TABLE_PATH = `/v${API_VERSION}/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`

const airtable = new Airtable({
  apiKey: API_KEY,
  endpointUrl: 'http://localhost',
})

const base = airtable.base(BASE_ID)

const table = base.table(TABLE_NAME)

const list = async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _page of table.list()) {
  }
}

const records = async () => {
  await table.records()
}
const findRecord = async () => {
  await table.findRecord('record_123')
}

const createRecords = async () => {
  await table.createRecords(createRequestBody)
}

const updateRecords = async () => {
  await table.updateRecords(updateRequestBody)
}

const deleteRecords = async () => {
  await table.deleteRecords(['123', '456'])
}

const deleteRecordUnexpected = async () => {
  await table.deleteRecords(['lol'])
}

const tests = [
  [list, TABLE_PATH, 'get'],
  [records, TABLE_PATH, 'get'],
  [findRecord, `${TABLE_PATH}/record_123`, 'get'],
  [createRecords, TABLE_PATH, 'post'],
  [updateRecords, TABLE_PATH, 'patch'],
  [deleteRecords, TABLE_PATH, 'delete'],
] as Array<[() => Promise<void>, string, 'get' | 'patch' | 'post' | 'delete']>

const errors = [
  [400, 'Bad Request'],
  [401, 'Unauthorized'],
  [402, 'Payment Required'],
  [403, 'Forbidden'],
  [404, 'Not Found'],
  [413, 'Request Too Large'],
  [422, 'Invalid Request'],
  [500, 'Internal Server Error'],
  [502, 'Bad Gateway'],
  [503, 'Service Unavailable'],
] as Array<[number, string]>

describe('Errors', () => {
  const { scope } = start()
  beforeEach(() => {
    nock.cleanAll()
  })

  tests.forEach(([test, path, method]) => {
    errors.forEach(([code, message]) => {
      it(`returns an ${code} error for ${test.name}`, async () => {
        scope[method](path).reply(code, { message }).persist()
        try {
          await test()
        } catch (error) {
          if (![401, 403, 404, 413, 422, 429].includes(code) && code >= 400 && code < 500) {
            expect(error.status).toEqual(400)
          } else {
            expect(error.status).toEqual(code)
          }
        }
        scope.done()
      })
    })
  })

  it('returns an unexpected error for deleteRecordUnexpected', async () => {
    try {
      await deleteRecordUnexpected()
    } catch (error) {
      expect(error.status).toEqual(-1)
    }
  })
})
