Based on the he official [Airtable JavaScript library](https://github.com/lsagetlethias/airtable.js).

# Airtable.js

The Airtable API provides a simple way of accessing your
data. Whether it's contacts, sales leads, inventory, applicant
information or todo items, the vocabulary of the interactions closely
matches your data structure. You will use your table names to address
tables, column names to access data stored in those columns. In
other words, the Airtable API is your own RESTful API for your
base.

# Installation

## Node.js

To install Airtable.js in a node project:

```sh
npm install @lsagetlethias/node-airtable
yarn add @lsagetlethias/node-airtable
```

Airtable.js is compatible with Node 18 and above.

# Configuration

There are three configurable options available:

* `apiKey` - your secret API token. Visit [/create/tokens](https://airtable.com/create/tokens) to create a personal access token. [OAuth access tokens](https://airtable.com/developers/web/guides/oauth-integrations) can also be used.
* `endpointUrl` - the API endpoint to hit. You might want to override
  it if you are using an API proxy (e.g. runscope.net) to debug your API calls. (`AIRTABLE_ENDPOINT_URL`).
* `requestTimeout` - the timeout in milliseconds for requests. The default is 5 minutes (`300000`).

You can set the options globally via `Airtable.configure`:

```js
Airtable.configure({ apiKey: 'YOUR_SECRET_API_TOKEN' })
```

Globally via process env (e.g. in 12factor setup):

```sh
export AIRTABLE_API_KEY=YOUR_SECRET_API_TOKEN
```

You can also override the settings per connection:

```js
const airtable = new Airtable({endpointUrl: 'https://api-airtable-com-8hw7i1oz63iz.runscope.net/'})
```

# Interactive documentation

Go to <https://airtable.com/api> to see the interactive API documentation for your Airtable bases. Once you select a base, click the "JavaScript" tab to see code snippets using Airtable.js. It'll have examples for all operations you can perform against your base using this library.

You can also view non-interactive API documentation at <https://airtable.com/developers/web/api>.

# Promises

As of original lib's [v0.5.0](https://github.com/Airtable/airtable.js/releases/tag/v0.5.0) all of the methods that would take a `done` callback would return a Promise if you don't pass in a `done` callback.

Now all methods are Promise-based only.

For example:

```js
// not supported anymore
table.select().firstPage(result => { ... })
```

is equivalent to

```js
table.select().firstPage().then(result => { ... })
```
