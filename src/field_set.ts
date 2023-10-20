import {Collaborator} from './collaborator';
import {Attachment} from './attachment';
import {Barcode} from './barcode';
import {Button} from './button';
import { SyncSource } from './sync_source';

// AI Text
// Attachment: Attachment
// Auto number: number
// Barcode: Barcode
// Button: Button
// Checkbox: boolean
// Collaborator: Collaborator
// Count: number
// Created by: Collaborator
// Created time: string
// Currency: number
// Date: string
// Date and time: string
// Duration: number
// Email: string
// Formula: string | number
// Last modified by: 
// Last modified time: string
// Link to another record: string[]
// Long text: string
// Lookup: FieldValue[]
// Multiple collaborator: Collaborator[]
// Multiple select: string[]
// Number: number
// Percent: number
// Phone: string
// Rating: number
// Rich text: string
// Rollup: FieldValue (string[], number[], string)
// Single line text: string
// Single select: string
// Sync source: SyncSource
// Url: string
export type FieldValue = string | number | boolean | Collaborator | SyncSource | ReadonlyArray<Attachment> | ReadonlyArray<FieldValue>;
export interface FieldSet {
    [key: string]: FieldValue;
}
