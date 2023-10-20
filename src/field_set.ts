import {Collaborator} from './collaborator';
import {Attachment} from './attachment';

export type FieldValue = string | number | boolean | Collaborator | ReadonlyArray<Collaborator> | ReadonlyArray<string> | ReadonlyArray<Attachment> | ReadonlyArray<FieldValue>;
export interface FieldSet {
    [key: string]: FieldValue;
}
