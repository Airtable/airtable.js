/**
 * Example: Using table.upsert() method
 *
 * This example demonstrates how to use the upsert method to update existing records
 * or create new ones based on specified merge fields.
 */

import Airtable from 'airtable';

// Configure Airtable
Airtable.configure({apiKey: 'YOUR_API_KEY'});
const base = Airtable.base('YOUR_BASE_ID');
const table = base('Table Name');

async function upsertExample(): Promise<void> {
    try {
        // Example 1: Basic upsert with single merge field
        console.log('=== Basic Upsert ===');
        const records1 = await table.upsert(
            [
                {fields: {Name: 'John Doe', Email: 'john@example.com', Status: 'Active'}},
                {fields: {Name: 'Jane Smith', Email: 'jane@example.com', Status: 'Pending'}},
            ],
            ['Email'] // Merge on Email field
        );
        console.log('Upserted records:', records1.length);

        // Example 2: Upsert with multiple merge fields
        console.log('\n=== Multi-field Upsert ===');
        const records2 = await table.upsert(
            [
                {
                    fields: {
                        Name: 'Bob Johnson',
                        Email: 'bob@company.com',
                        Company: 'Acme Corp',
                        Department: 'Engineering',
                    },
                },
            ],
            ['Email', 'Company'] // Merge on both Email and Company
        );
        console.log('Upserted with multiple merge fields:', records2.length);

        // Example 3: Upsert with typecast option
        console.log('\n=== Upsert with Typecast ===');
        const records3 = await table.upsert(
            [{fields: {Name: 'Alice Brown', Email: 'alice@example.com', Age: '25'}}],
            ['Email'],
            {typecast: true} // Automatically convert string '25' to number
        );
        console.log('Upserted with typecast:', records3.length);

        // Example 4: Using callback API
        console.log('\n=== Callback API ===');
        table.upsert(
            [{fields: {Name: 'Charlie Wilson', Email: 'charlie@example.com'}}],
            ['Email'],
            (err, records) => {
                if (err) {
                    console.error('Upsert failed:', err);
                } else {
                    console.log('Callback upsert successful:', records.length);
                }
            }
        );
    } catch (error) {
        console.error('Upsert error:', error);
    }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
    upsertExample();
}

export {upsertExample};
