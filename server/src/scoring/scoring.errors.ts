/**
 * Thrown when scoring cannot be completed due to invalid or missing input.
 *
 * Callers (e.g. ActivitiesService in Phase 7) should catch ScoringError and
 * convert it to an appropriate HTTP exception (e.g. UnprocessableEntityException).
 */
export class ScoringError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScoringError'
    // Restore prototype chain (needed when transpiling to ES5)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
