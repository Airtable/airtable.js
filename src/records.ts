import { type FieldSet } from "./field_set";
import { type Record } from "./record";

export type Records<TFields extends FieldSet> = ReadonlyArray<Record<TFields>>;
