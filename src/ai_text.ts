export interface AiTextResult {
    state: 'empty' | 'loading' | 'generated';
    isState: boolean;
    value?: string;
}

export interface AiTextError {
    state: 'error';
    errorType: string;
    isState: boolean;
    value?: string;
}
