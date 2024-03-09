import { type Attachment } from "./attachment";
import { type Collaborator } from "./collaborator";

export interface FieldSet {
  [key: string]:
    | Collaborator
    | boolean
    | number
    | string
    | readonly Attachment[]
    | readonly Collaborator[]
    | readonly string[]
    | undefined;
}
