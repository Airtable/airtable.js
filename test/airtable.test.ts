'use strict'
import Airtable from '../src/airtable'

describe('Airtable', function () {
  beforeEach(() => {
    Airtable.configure(Airtable.defaultConfig())
    delete Airtable.apiKey
    delete process.env.AIRTABLE_API_KEY
  })

  it('recognizes API key as a property of the constructor', function () {
    try {
      Airtable.apiKey = 'keyAbc'
      new Airtable({})
      new Airtable()

      expect(Airtable.apiKey).toEqual('keyAbc')
    } finally {
      delete Airtable.apiKey
    }
  })

  it('recognizes API key as an environment constiable', function () {
    try {
      process.env.AIRTABLE_API_KEY = 'keyDef'
      new Airtable({})
      new Airtable()
      expect(Airtable.apiKey).toEqual('keyDef')
    } finally {
      delete process.env.AIRTABLE_API_KEY
    }
  })

  it('throws when API key is not provided', function () {
    expect(function () {
      new Airtable({})
    }).toThrow()

    expect(function () {
      new Airtable()
    }).toThrow()
  })

  describe('configure static method', function () {
    beforeEach(() => {
      Airtable.configure(Airtable.defaultConfig())
      process.env.AIRTABLE_API_KEY = undefined
    })
    it('sets the apiKey', function () {
      Airtable.configure({ apiKey: 'keyGhi' })

      try {
        expect(Airtable.apiKey).toEqual('keyGhi')
      } finally {
        // delete Airtable.apiKey
      }
    })
  })

  describe('base static method', function () {
    it('throws in the absense of an API key', function () {
      expect(function () {
        Airtable.base('abaseid')
      })
    })

    it('returns a Base function configured with the given base and access to tables', function () {
      try {
        Airtable.apiKey = 'keyJkl'
        const base = Airtable.base('abaseid')

        expect(base.id).toBe('abaseid')
        expect(base.table('atablename').name).toBe('atablename')
      } finally {
        delete Airtable.apiKey
      }
    })
  })

  describe('base instance method', function () {
    it('returns a Base instance configured with the given ID', function () {
      const base = new Airtable({ apiKey: 'keyMno' }).base('anotherbaseid')

      expect(base.id).toBe('anotherbaseid')
    })
  })
})
