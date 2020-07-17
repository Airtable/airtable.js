import Airtable from '../src/airtable'
import Table from '../src/table'

describe('Base', () => {
  it('returns an instance of Table', () => {
    Airtable.apiKey = 'keyAbc'
    expect(new Airtable().base('abc').table('123')).toBeInstanceOf(Table)
  })
})
