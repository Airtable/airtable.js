import Airtable from '../../lib/dist/src'
const API_KEY = process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_BASE_ID
export default async function (req, res) {
  const base = new Airtable({
    apiKey: API_KEY,
  }).base(BASE_ID)

  const projects = await base.table('Design projects').records({ maxRecords: 10 })
  res.setHeader('Content-Type', 'application/json')
  if (typeof res.send === 'function') {
    res.send(JSON.stringify(projects.records))
  } else {
    res.end(JSON.stringify(projects.records))
  }
}
