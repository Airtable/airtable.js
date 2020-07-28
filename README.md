The official Airtable JavaScript library.

# Airtable.js

The Airtable API provides a simple way of accessing your data. Whether it's contacts, sales leads,
inventory, applicant information or todo items, the vocabulary of the interactions closely matches
your data structure. You will use your table names to address tables, column names to access data
stored in those columns. In other words, the Airtable API is your own RESTful API for your base.

# Installation

### Node.js

To install airtable.js in a node project:

```sh
# npm
npm install airtable
# yarn
yarn add airtable

```

# Configuration

There are three configurable options available:

- `apiKey` - set the token to your secret API token. Visit
  [your account page](https://airtable.com/account) to create an API token. (`AIRTABLE_API_KEY`)
- `endpointUrl` - the API endpoint to hit. You might want to override it if you are using an API
  proxy (e.g. runscope.net) to debug your API calls. (`AIRTABLE_ENDPOINT_URL`)
- `requestTimeout` - the timeout in milliseconds for requests. The default is 5 minutes (`300000`)

You can set the options globally via `Airtable.configure`:

    Airtable.configure({ apiKey: 'YOUR_SECRET_API_KEY' })

Globally via process env (e.g. in 12factor setup).

    export AIRTABLE_API_KEY=YOUR_SECRET_API_KEY

You can also override the settings per connection:

    var airtable = new Airtable({endpointUrl: 'https://api-airtable-com-8hw7i1oz63iz.runscope.net/'})

# Interactive documentation

Go to https://airtable.com/api to see the interactive API documentation for your Airtable bases.
Once you select a base, click the "JavaScript" tab to see code snippets using Airtable.js. It'll
have examples for all operations you can perform against your base using this library.

# Usage

```ts
import Airtable from 'airtable'

const airtable = new Airtable({ apiKey: '...' })

const base = airtable.base('base_id')
const table = base.table('My Table')

// Get the records
const { records, offset } = await table.records({ maxResult: 10 })

for (const record of records) {
  const { 'Project Name': name } = record.fields
  console.log(name)
}

// You can also auto paginate
for await (const records of table.list({ maxResult: 10 })) {
  for (const record of records) {
    const { 'Project Name': name } = record.fields
    console.log(name)
  }
}
```

# Examples

Two examples are provided. The first is a Next.js project and the second is a Nuxt project. Both
examples use the basic `Project tracker` example that Airtable provides when creating an account.

To start the Next project, you will need to copy `.env.development` to `.env.development.local` and
add the API key and the base ID that you will be using. Then, run `npm run serve:next`.

To start the Nuxt project, you will need to prepend the API key and the base ID to the `dev` script:

```sh
AIRTABLE_API_KEY=... AIRTABLE_BASE_ID=... npm run serve:nuxt
```

# Tests

Tests are run via `npm run test`.

We strive for 100% test coverage. Some aspects may not be testable or suitable for test coverage.

When you run the tests a coverage report will be generated at `./coverage/lcov-report/index.html`
which you can access in the browser for line by line reporting.
