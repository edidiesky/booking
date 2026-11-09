export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    msg: string,
    details?: unknown,
    code = "BAD_REQUEST",
  ): AppError {
    return new AppError(msg, 400, code, true, details);
  }

  static unauthorized(msg = "Unauthorized.", code = "UNAUTHORIZED"): AppError {
    return new AppError(msg, 401, code, true);
  }

  static forbidden(msg = "Forbidden.", code = "FORBIDDEN"): AppError {
    return new AppError(msg, 403, code, true);
  }

  static notFound(msg = "Resource not found.", code = "NOT_FOUND"): AppError {
    return new AppError(msg, 404, code, true);
  }

  static conflict(msg: string, code = "CONFLICT", details?: unknown): AppError {
    return new AppError(msg, 409, code, true, details);
  }

  static unprocessable(
    msg: string,
    code = "UNPROCESSABLE",
    details?: unknown,
  ): AppError {
    return new AppError(msg, 422, code, true, details);
  }

  static tooManyRequests(
    msg = "Too many requests.",
    code = "RATE_LIMITED",
  ): AppError {
    return new AppError(msg, 429, code, true);
  }

  static serviceUnavailable(
    msg = "Service temporarily unavailable.",
    code = "SERVICE_UNAVAILABLE",
  ): AppError {
    return new AppError(msg, 503, code, true);
  }

  static internal(
    msg = "An unexpected error occurred.",
    code = "INTERNAL",
  ): AppError {
    return new AppError(msg, 500, code, false);
  }
}
