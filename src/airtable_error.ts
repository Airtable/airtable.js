class AirtableError extends Error {
    error: string;
    message: string;
    statusCode: number;

    constructor(error: string, message: string, statusCode: number) {
        super(message);
        this.name = 'AirtableError';
        this.error = error;
        this.message = message;
        this.statusCode = statusCode;
        this.toString = AirtableError.prototype.toString.bind(this);
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
