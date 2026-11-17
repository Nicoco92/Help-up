export type ExploreErrorCode = 'INVALID_INPUT' | 'UNAUTHORIZED' | 'NOT_FOUND'

export class ExploreError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ExploreErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ExploreError'
  }
}
