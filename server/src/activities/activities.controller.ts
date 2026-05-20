import { Body, Controller, Post } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { CreateHikingActivityDto } from './dto/create-hiking-activity.dto'
import { CreateClimbingActivityDto } from './dto/create-climbing-activity.dto'

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
   * Creates one row in `activities` + one row in `hiking_activity_details`.
   *
   * Returns 201 Created with the full activity + hikingDetail.
   * Returns 400 if DTO validation fails.
   * Returns 404 if userId or clubId (for official) does not exist.
   * Returns 422 if official fields fail EOOA rules or scoring fails.
   */
  @Post('hiking')
  createHiking(@Body() dto: CreateHikingActivityDto) {
    return this.activitiesService.createHiking(dto)
  }

  /**
   * Submit a Rock Climbing activity.
   *
   * Creates one row in `activities` + one row in `climbing_activity_details`.
   *
   * The route_id must reference an existing route. The service snapshots
   * routeName, mountainOrArea, and climbingField from the canonical Route —
   * these fields must NOT be sent in the payload.
   *
   * Returns 201 Created with the full activity + climbingDetail.
   * Returns 400 if DTO validation fails.
   * Returns 404 if userId, routeId, or clubId (for official) does not exist.
   * Returns 422 if official fields fail EOOA rules, French grade has no mapping,
   *             or scoring fails.
   */
  @Post('climbing')
  createClimbing(@Body() dto: CreateClimbingActivityDto) {
    return this.activitiesService.createClimbing(dto)
  }
}
