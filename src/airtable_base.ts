import Table from './table';
import Base from './base';
import {FieldSet} from './field_set';

export interface AirtableBase {
    <TFields extends FieldSet>(tableName: string): Table<TFields>;
    getId: Base['getId'];
    makeRequest: Base['makeRequest'];
    table: Base['table'];
}
