export interface AiTextResult {
    state: 'empty' | 'loading' | 'generated' | 'error';
    isStale: boolean;
    value?: string;
    errorType?: string;
}
