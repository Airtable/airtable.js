class AirtableError {
    error: string;
    message: string;
    statusCode: number;

    constructor(error: string, message: string, statusCode: number) {
        this.error = error;
        this.message = message;
        this.statusCode = statusCode;
    }

    toString(): string {
        return [
            this.message,
            '(',
            this.error,
            ')',
            this.statusCode ? `[Http code ${this.statusCode}]` : '',
        ].join('');
    }
}

export = AirtableError;
