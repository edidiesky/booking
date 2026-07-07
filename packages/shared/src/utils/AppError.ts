export class AppError extends Error {
  public statusCode:    number;
  public isOperational: boolean;
  public details?:      unknown;

  constructor(message: string, statusCode: number, isOperational = true, details?: unknown) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = isOperational;
    this.details       = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg: string, details?: unknown): AppError { return new AppError(msg, 400, true, details); }
  static unauthorized(msg = "Unauthorized."): AppError        { return new AppError(msg, 401, true); }
  static forbidden(msg = "Forbidden."): AppError              { return new AppError(msg, 403, true); }
  static notFound(msg = "Resource not found."): AppError      { return new AppError(msg, 404, true); }
  static conflict(msg: string, d?: unknown): AppError         { return new AppError(msg, 409, true, d); }
  static unprocessable(msg: string, d?: unknown): AppError    { return new AppError(msg, 422, true, d); }
  static serviceUnavailable(msg = "Service temporarily unavailable."): AppError { return new AppError(msg, 503, true); }
  static internal(msg = "An unexpected error occurred."): AppError { return new AppError(msg, 500, false); }
}
