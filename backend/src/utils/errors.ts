export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Requête invalide', code = 'INVALID_INPUT') {
    super(400, code, message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentification requise ou invalide', code = 'UNAUTHORIZED') {
    super(401, code, message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès interdit', code = 'FORBIDDEN') {
    super(403, code, message)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable', code = 'NOT_FOUND') {
    super(404, code, message)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit de ressource', code = 'EMAIL_ALREADY_USED') {
    super(409, code, message)
  }
}
