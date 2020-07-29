export type AirtableErrorType =
  | 'ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'NOT_AUTHORIZED'
  | 'REQUEST_TOO_LARGE'
  | 'NOT_FOUND'
  | 'CANNOT_PROCESS_OPERATION'
  | 'TOO_MANY_REQUESTS'
  | 'SERVER_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_GATEWAY'

export abstract class AbstractAirtableError extends Error {
  constructor(
    readonly message: string = '',
    readonly status: number = -1,
    readonly type: AirtableErrorType = 'ERROR'
  ) {
    super(message)
    if (message) {
      this.message = `\n\n[Airtable ${type === 'ERROR' ? type : `${type} ERROR`}]: ${this.message}`
      return
    }

    this.message = `\n\n[AIRTABLE ERROR]: ${type}`
  }
}

// Generic Error
export const AirtableError = class extends AbstractAirtableError {
  constructor() {
    super('An unexpected error occurred', -1, 'ERROR')
  }
}

// Handle 400
export const UnexpectedError = class extends AbstractAirtableError {
  constructor(message?: string) {
    super(message || 'An unexpected error occurred', 400, 'ERROR')
  }
}

// Handle 401
export const AuthenticationRequiredError = class extends AbstractAirtableError {
  constructor(message?: string) {
    super(
      message || 'You should provide a valid key to perform this operation',
      401,
      'AUTHENTICATION_REQUIRED'
    )
  }
}

// Handle 403
export const NotAuthorizedError = class extends AbstractAirtableError {
  constructor(message?: string) {
    super(message || 'You are not authorized to perform this operation', 403, 'NOT_AUTHORIZED')
  }
}

// Handle 404
export const NotFoundError = class extends AbstractAirtableError {
  constructor() {
    super('', 404, 'NOT_FOUND')
  }
}

// Handle 413
export const RequestTooLargeError = class extends AbstractAirtableError {
  constructor() {
    super('Request body is too large', 413, 'REQUEST_TOO_LARGE')
  }
}

// Handle 422
export const CannotProcessOperationError = class extends AbstractAirtableError {
  constructor(message?: string) {
    super(message || 'The operation cannot be processed', 422, 'CANNOT_PROCESS_OPERATION')
  }
}

// Handle 429
export const TooManyRequestsError = class extends AbstractAirtableError {
  constructor() {
    super(
      'You have made too many requests in a short period of time. Please retry your request later',
      429,
      'TOO_MANY_REQUESTS'
    )
  }
}

export const ServerError = class extends AbstractAirtableError {
  constructor() {
    super(
      'The server encountered an unexpected condition. If the problem persists, contact support.',
      500,
      'SERVER_ERROR'
    )
  }
}

export const BadGatewayError = class extends AbstractAirtableError {
  constructor() {
    super(
      "Airtable's servers are restarting or an unexpected outage is in progress. You should generally not receive this error, and requests are safe to retry. Please retry shortly.",
      502,
      'BAD_GATEWAY'
    )
  }
}

export const ServiceUnavailableError = class extends AbstractAirtableError {
  constructor() {
    super(
      'The server could not process your request in time. The server could be temporarily unavailable, or it could have timed out processing your request. Please retry shortly.',
      503,
      'SERVICE_UNAVAILABLE'
    )
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createError(status?: number, message?: string) {
  switch (status) {
    case 401:
      return new AuthenticationRequiredError()
    case 403:
      return new NotAuthorizedError()
    case 404:
      return new NotFoundError()
    case 413:
      return new RequestTooLargeError()
    case 422:
      return message ? new CannotProcessOperationError(message) : new CannotProcessOperationError()
    case 429:
      return new TooManyRequestsError()
    case 500:
      return new ServerError()
    case 502:
      return new BadGatewayError()
    case 503:
      return new ServiceUnavailableError()
    default:
      if (status && status >= 400) {
        return message ? new UnexpectedError(message) : new UnexpectedError()
      }

      return new AirtableError()
  }
}
