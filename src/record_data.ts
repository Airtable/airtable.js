export interface RecordData<TFields> {
    id: string;
    fields: TFields;
    commentCount?: number;
}
