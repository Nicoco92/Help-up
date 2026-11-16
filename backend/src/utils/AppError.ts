export type ErrorCode = 'INVALID_INPUT' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'EMAIL_ALREADY_USED' | 'CONFLICT';

class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
  }



}

export default AppError;