import Record from './record';
import {FieldSet} from './field_set';

export type Records<TFields extends FieldSet> = ReadonlyArray<Record<TFields>>;
