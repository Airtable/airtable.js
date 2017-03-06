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
