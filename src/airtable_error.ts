export class AirtableError extends Error {
  constructor(
    public error: string,
    public message: string,
    public statusCode?: number,
  ) {
    super(message);
  }

  public toString(): string {
    return [this.message, "(", this.error, ")", this.statusCode ? `[Http code ${this.statusCode}]` : ""].join("");
  }
}
