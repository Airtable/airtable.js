# v0.11.6
 * Remove behavior of including `AIRTABLE_API_KEY` in airtable.browser.js via envify
 * Add web worker compatibility

# v0.11.5
 * Update select() and list() to support to use POST endpoint when GET url length would exceed Airtable's 16k character limit
 * Update select() and list() to explicitly choose to use GET or POST endpoint via new 'method' arg

# v0.11.4
 * Add support for returnFieldsByFieldId param.

# v0.11.3
 * Add a UMD build to use for browser-targeted builds. This fixes an issue where other apps that
 use airtable.js as a dependency were bundling code that expects to run in a node environment when
 building for a browser enviornment.

# v0.11.2
 * Bump NPM package versions (#276, #281, #293, #296, #297, #298)

# v0.11.1
 * Bump NPM package versions (#250, #253, #266, #267, #268)

# v0.11.0
 * Add support for custom headers
 * Allow requestTimeout to be configured like other AirtableOptions
 * Fix type warnings

# v0.10.1
 * Fix error handler in updating an array (#223)
 * Fix binding fetch to window (#235)
 * Update lodash and node-fetch dependencies
 * Widen @types/node dependency

# v0.10.0
 * Convert to TypeScript. The project now comes with .d.ts typescript definition files.

# v0.9.0
 * Remove Promise polyfill (#195)
 * Replace deprecated `request` library with `node-fetch` (#191)
 * Increase test coverage of library to 100% (#190, #188, #187, #186, #185, #184, #183 #182, #181, #178, #177, #176, #175)
 * Enable CI (#173, #190)
 * Improve README (#164)
 * Remove support for Safari 10.0

# v0.8.1
 * Require Node 8 or above (down from Node 10)

# v0.8.0
 * Require Node 10 or above
 * Add Promise polyfill (#147)
 * Remove `allowUnauthorizedSsl` option

# v0.7.2
 * Properly reject unauthorized SSL certificates (#140)
 * Minor tweaks to formatting in README (#136)
 * Update Lodash to 4.17.15 (#141)

# v0.7.1
 * Fix a User-Agent bug in Node (#132)
 * Stop publishing non-essential files to npm (#128)

# v0.7.0
 * Remove custom class library, shrinking the file size and improving debugging (#123)
 * Improve an error message (#115)
 * Update Lodash to 4.17.14 (#124)

# v0.6.0
 * Add support for beta of batch record operations (#86, #88, #92)
 * Add backoff when rate limited (#110)
 * Shrink browser build by removing `assert` module (#101)
 * Fix bug when calling some functions with callbacks (#103)

# v0.5.10
 * Make API key less likely to be logged (#82, #83)

# v0.5.9
 * Update `lodash` dependency (#80)

# v0.5.8
 * Remove `async` dependency (#76)
 * Shrink size of browser build by about half (#76)

# v0.5.7
 * Support dotenv for loading config (#59)
 * Improve error message is select() is called without args (#70)
 * Update dependencies (#73)

# v0.5.6
 * Fix crash when specifying sort direction or cellFormat options

# v0.5.5
 * Upgrade `lodash` package from 2.4.1 to 4.17.10

# v0.5.4
 * Upgrade `request` package to 2.85.0

# v0.5.3
 * Fix User-Agent header warnings when running Chrome (#52)
 * Fix JSON imports so webpack can bundle

# v0.5.2
 * Support for the `cellFormat`, `userLocale`, and `timeZone` parameters

# v0.5.1

 * Improved handling of unexpected server errors
 * Exports AirtableError class as Airtable.Error for use in
   `instanceof` checks.

# v0.5.0

 * Optional Promise-based API: if you call any method that takes a
   callback without providing a callback, it will return a Promise:

        table.find(recordId).then(record => {
            // Process record.
        }).catch(err => {
            // Handle error.
        })

  * Added an `all()` method for automatically fetching all records
    across all pages when selecting from a table:

        table.select({view: 'Main View'}).all().then(records => {
            // records array will contain every record in Main View.
        }).catch(err => {
            // Handle error.
        })

# v0.4.5

 * The default timeout for requests is increased from 30 seconds
   to 5 minutes. You can set a custom timeout by passing `requestTimeout`
   in milliseconds to the Airtable constructor or Airtable.configure:

       Airtable.configure({requestTimeout: 30 * 1000}); // 30 seconds

# v0.4.4

 * airtable.browser.js no longer implicitly depends on jQuery being available
   on the page.
 * Upgraded dependency: request 2.79.0 (removes tough-cookie vulnerability warning).

# v0.4.3

 * Fixed issue that prevented callback from being called with error
   when running in the browser and servers are unreachable.

# v0.4.2

 * Upgraded dependencies: async 1.5.2, request 2.73.0

# v0.4.1

 * Fixed a bug that prevented records returned from select queries
   from being deleted.

 * Fixed the demo page (test/test_files/index.html)

# v0.4.0

 * Added `Table.select` for querying records in a table. It takes the
   following optional parameters for sorting and filtering records:

        fields: only include the specified fields in results.
        filterByFormula: only include records that satisfy the formula.
        maxRecords: at most, return this many records in total.
        pageSize: at most, return this many records in each request.
        sort: specify fields to use for sorting the records.
        view: return records from a specific view, using the view order.

 * Deprecated `Table.list` and `Table.forEach`. Use `Table.select` instead.

# v0.2.0

 * Renamed Application to Base. This is a breaking change for the client, no changes in the API.

# v0.1.19

 * Added ability to listRecords according to view (filters and order) and sort by a field.
