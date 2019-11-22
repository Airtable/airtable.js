const semver = require('semver');
const packageJson = require('../package.json');

describe('current Node version', () => {
    it("matches package.json's `engines` field'", () => {
        expect(semver.satisfies(process.versions.node, packageJson.engines.node)).toBe(true);
    });
});
