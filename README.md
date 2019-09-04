The official Airtable JavaScript library.

# Airtable.js

The Airtable API provides a simple way of accessing your
data. Whether it's contacts, sales leads, inventory, applicant
information or todo items, the vocabulary of the interactions closely
matches your data structure. You will use your table names to address
tables, column names to access data stored in those columns. In
other words, the Airtable API is your own RESTful API for your
base.

# Installation

### Node.js

To install airtable.js in a node project:

    npm install airtable


### Browser

To use airtable.js in the browser, use [airtable.browser.js](https://github.com/Airtable/airtable.js/blob/master/build/airtable.browser.js) which is in the `build` folder.

For a demo, run:
```
cd test/test_files
python -m SimpleHTTPServer
```

Edit `test/test_files/index.html` - put your `BASE_ID` and `API_KEY` (Be careful! You are putting your API key on a web page! Create a separate account and share only one base with it).

Then open http://localhost:8000/ in your browser.


# Configuration

There are three configurable options available:

  * `apiKey` - set the token to your secret API token. Visit [your account page](https://airtable.com/account) to create an API token.  (`AIRTABLE_API_KEY`)
  * `endpointUrl` - the API endpoint to hit. You might want to override
    it if you are using an API proxy (e.g. runscope.net) to debug your API calls. (`AIRTABLE_ENDPOINT_URL`)
  * `requestTimeout` - the timeout in milliseconds for requests. The default is 5 minutes (`300000`)

You can set the options globally via `Airtable.configure`:

    Airtable.configure({ apiKey: 'YOUR_SECRET_API_KEY' })


Globally via process env (e.g. in 12factor setup).

    export AIRTABLE_API_KEY=YOUR_SECRET_API_KEY

You can also override the settings per connection:

    var airtable = new Airtable({endpointUrl: 'https://api-airtable-com-8hw7i1oz63iz.runscope.net/'})

# Interactive documentation

Go to https://airtable.com/api to see the interactive API documentation for your Airtable bases. It'll have examples for all operations you can perform against your bases.

# Promises

As of [v0.5.0](https://github.com/Airtable/airtable.js/releases/tag/v0.5.0) all of the methods that take a `done` callback will return a Promise if you don't pass in a `done` callback.

For example:

```js
table.select().firstPage(result => { ... })
```

is equivalent to

```js
table.select().firstPage().then(result => { ... })
```

# Where are the tests?

Our tests live in a different repository and tests run on every `git push`.
We strive to have all of the API covered along with all API error conditions.
If you hit something that's not right, be sure to ping us on intercom or open
a GitHub Issue.
