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
