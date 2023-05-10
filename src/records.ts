import Record from './record';
import {FieldSet} from './field_set';

export interface ResultMetadata {
    offset: string
}

/**
 * Note: This type is used as the result of queries, but did not originally contain metadata such as the offset field
 * required for pagination. We've kept the array type here for compatibility but somewhat hackily annotated it with
 * additional properties.
 */
export type Records<TFields extends FieldSet> = ReadonlyArray<Record<TFields>> & ResultMetadata;
