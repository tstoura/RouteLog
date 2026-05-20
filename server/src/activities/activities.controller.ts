import { Body, Controller, Post } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { CreateHikingActivityDto } from './dto/create-hiking-activity.dto'

/**
 * NOTE: All endpoints here are currently UNPROTECTED for development convenience.
 * A later auth/authorization phase will add JWT guards so that:
 *   - userId comes from the decoded token, not the request body.
 *   - Users can only create activities for themselves.
 *   - club_id ownership is verified against the user's memberships.
 */
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Submit a Hiking / Ski Mountaineering activity.
   *
   * Creates one row in `activities` and one matching row in
   * `hiking_activity_details` using the same activity_id (implicit transaction).
   *
   * Request body: CreateHikingActivityDto
   *
   * Official activity (isOfficial: true):
   *   - All EOOA fields required and validated.
   *   - Points calculated by ScoringService and returned in the response.
   *
   * Personal activity (isOfficial: false):
   *   - club_id optional.
   *   - field_type and difficulty_grade can be any non-empty string.
   *   - points = null.
   *
   * Returns 201 Created with the full activity + hikingDetail object.
   * Returns 400 if DTO validation fails.
   * Returns 404 if userId or clubId (for official) does not exist.
   * Returns 422 if official fields fail EOOA rules or scoring fails.
   */
  @Post('hiking')
  createHiking(@Body() dto: CreateHikingActivityDto) {
    return this.activitiesService.createHiking(dto)
  }
}
