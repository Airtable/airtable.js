import Table from './table';
import {Base, BaseRequestOptions, BaseResponse} from './base';

export type AirtableBase = {
    (tableName: string): Table;
    _base: Base;
    getId(): string;
    makeRequest(options: BaseRequestOptions): Promise<BaseResponse>;
    table(tableName: string): Table;
};
