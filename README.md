The awesome Airtable javascript library. It's official.

# Airtable.js

The Airtable API provides a simple way of accessing *your*
data. Whether it's contacts, sales leads, inventory, applicant
information or todo items, the vocabulary of the interactions closely
matches your data structure. You will use your table names to address
tables, column names to access data stored in those column IDs. In
other words, Airtable API is your own RESTful API for your
base.

We hope you find it fun and easy!


# Configuration

There are two configurable options available:

  * apiKey - set the token to your secret API token. Visit [your account page](https://airtable.com/account) to create an API token.  (`AIRTABLE_API_KEY`)
  * endpointUrl - the API endpoint to hit. You might want to override
    it if you are using an API proxy (e.g. runscope.net) to debug your API calls. (`AIRTABLE_ENDPOINT_URL`)

You can set the options globally via Airtable.configure:

    Airtable.configure({ apiKey: 'YOUR_SECRET_API_KEY })


Globally via process env (e.g. in 12factor setup).

    export AIRTABLE_API_KEY=YOUR_SECRET_API_KEY

You can also override the settings per connection:

    var airtable = new Airtable({endpointUrl: 'https://api-airtable-com-8hw7i1oz63iz.runscope.net/'})

# Interactive documentation

Go to https://airtable.com/api to see the interactive API documentation for your Airtable bases. It'll have examples for all operations you can perform against your bases.

# What happened to the tests?

Don't worry, we have tests. Our tests live in a different repository
and tests run on every git push. We strive to have all of the API covered
along with all API error conditions. If you hit something that's not
right, be sure to ping us on intercom or open a github issue.


# Roadmap

Here's a few things that we'll expose in the API shortly:

 * Transparently creating new multiple choice options when you update records.
 * Querying for recent changes
 * Receiving notifications about changed records

If you have a use case that needs something else, please reach out!
