export type ErrorCode = 'INVALID_INPUT' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'EMAIL_ALREADY_USED' | 'CONFLICT' | 'INTERNAL_ERROR';

class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }

  public static invalidInput(message: string): AppError {
    return new AppError('INVALID_INPUT', message, 400);
  }

  public static unauthorized(message: string): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  public static notFound(message: string): AppError {
    return new AppError('NOT_FOUND', message, 404);
  }

  public static emailAlreadyUsed(message: string): AppError {
    return new AppError('EMAIL_ALREADY_USED', message, 409);
  }

  public static conflict(message: string): AppError {
    return new AppError('CONFLICT', message, 409);
  }

  public static internalError(message: string): AppError {
    return new AppError('INTERNAL_ERROR', message, 500);
  }
}

export default AppError;