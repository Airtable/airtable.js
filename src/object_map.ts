/**
 * Allows creating an object map type with a dynamic key type.
 *
 * TypeScript only allows `string` for `K` in `{[key: K]: V}` so we need a utility to bridge
 * the gap.
 *
 * This is an alias for TypeScript’s `Record` type, but the name “record” is confusing given our
 * Airtable domain model.
 *
 * @hidden
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ObjectMap<K extends keyof any, V> = {[P in K]: V};
/* eslint-enable @typescript-eslint/no-explicit-any */
