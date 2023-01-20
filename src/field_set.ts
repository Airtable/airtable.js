import {Collaborator} from './collaborator';
import {Attachment} from './attachment';
import {Barcode} from './barcode';
import {Button} from './button';

export interface FieldSet {
    [key: string]:
        | undefined
        | null
        | string
        | number
        | boolean
        | Collaborator
        | Barcode
        | Button
        | ReadonlyArray<Collaborator>
        | ReadonlyArray<string>
        | ReadonlyArray<number | string | boolean | any>
        | ReadonlyArray<Attachment>;
}
