import {Collaborator} from './collaborator';
import {Attachment, AttachmentReference, CreateAttachment} from './attachment';

export interface FieldSet {
    [key: string]:
        | undefined
        | string
        | number
        | boolean
        | Collaborator
        | ReadonlyArray<Collaborator>
        | ReadonlyArray<string>
        | ReadonlyArray<Attachment | CreateAttachment | AttachmentReference>;
}
