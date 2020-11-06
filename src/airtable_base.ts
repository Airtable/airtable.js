import Table from './table';
import Base from './base';

export type AirtableBase = {
    (tableName: string): Table;
    getId: Base['getId'];
    makeRequest: Base['makeRequest'];
    table: Base['table'];
};
