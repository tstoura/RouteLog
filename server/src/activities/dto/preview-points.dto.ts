import { IsIn, IsObject, IsString } from 'class-validator'

export type PreviewPointsResult = {
  points: string | null
  isReady: boolean
  reason?: string
}

/**
 * Request body for POST /activities/preview-points.
 *
 * The payload is intentionally untyped at the DTO level — it is a partial
 * form snapshot that may be incomplete (expected during live preview).
 * The service validates each field individually and returns isReady=false
 * for incomplete/invalid states rather than throwing 422.
 */
export class PreviewPointsDto {
  @IsString()
  @IsIn(['hiking', 'climbing', 'expedition'])
  category: 'hiking' | 'climbing' | 'expedition'

  @IsObject()
  payload: Record<string, unknown>
}
