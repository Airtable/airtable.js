import nc from 'next-connect'
import Airtable from '../../lib/dist/src/airtable'

const app = nc()

app.get(async function (req, res) {
  const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
  }).base(process.env.AIRTABLE_BASE_ID)

  const projects = await base.table('Design projects').records({ maxRecords: 10 })
  res.send(projects.records)
})

export default app
