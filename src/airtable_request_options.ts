export type AirtableRequestOptions = {
    method?: string;
    path?: string;
    qs?: Record<string, string>;
    headers?: Record<string, string>;
    body?;
    _numAttempts?: number;
};
