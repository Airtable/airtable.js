// This will become package_version_browser.js when doing a browser build.
// See <https://github.com/Airtable/airtable.js/pull/132> for more.
/* eslint-disable @typescript-eslint/no-var-requires */
export = require('../package.json').version;
/* eslint-enable @typescript-eslint/no-var-requires */
