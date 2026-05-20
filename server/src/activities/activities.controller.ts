import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { CreateHikingActivityDto } from './dto/create-hiking-activity.dto'
import { CreateClimbingActivityDto } from './dto/create-climbing-activity.dto'
import { CreateExpeditionActivityDto } from './dto/create-expedition-activity.dto'
import { GetActivitiesDto } from './dto/get-activities.dto'

/**
 * NOTE: All endpoints here are currently UNPROTECTED for development convenience.
 * A later auth/authorization phase will add JWT guards so that:
 *   - userId comes from the decoded token, not the request body or query params.
 *   - Users can only create or read their own activities.
 *   - club_id ownership is verified against the user's memberships.
 */
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // ── Retrieval (Phase 8) ──────────────────────────────────────────────────

  /**
   * List activities for a user, optionally filtered by category.
   *
   * Query parameters:
   *   userId   — required (temporary; replaced by JWT token in auth phase)
   *   category — optional; "hiking" | "climbing" | "expedition"
   *   take     — page size, default 20, max 100
   *   skip     — offset, default 0
   *
   * Returns an array ordered by date descending.
   * Each activity includes hikingDetail, climbingDetail, and expeditionDetail;
   * exactly one will be non-null depending on the activity's category.
   *
   * Returns 400 if category is not one of the three allowed values.
   */
  @Get()
  findAllForUser(@Query() dto: GetActivitiesDto) {
    return this.activitiesService.findAllForUser(dto)
  }

  /**
   * Get a single activity by UUID with its full detail object.
   *
   * Query parameters:
   *   userId — optional; if provided, the activity must belong to that user
   *            (returns 404 if it does not, to avoid leaking ownership info).
   *
   * Returns 404 if the activity does not exist or does not belong to userId.
   */
  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('userId') userId?: string,
  ) {
    return this.activitiesService.findById(id, userId)
  }

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

  /**
   * Submit an Expeditions Abroad activity.
   *
   * Creates one row in `activities` + one row in `expedition_activity_details`.
   *
   * Official activity: requires all EOOA fields; points calculated and stored.
   * Personal activity: club_id optional; difficulty_grade relaxed; points null.
   *
   * Note: ski-mountaineering conditions → use season = "winter".
   * Note: organization_type = "no" when the expedition was not organized by the club.
   *
   * Returns 201 Created with the full activity + expeditionDetail.
   * Returns 400 if DTO validation fails.
   * Returns 404 if userId or clubId (for official) does not exist.
   * Returns 422 if official fields fail EOOA rules or scoring fails.
   */
  @Post('expedition')
  createExpedition(@Body() dto: CreateExpeditionActivityDto) {
    return this.activitiesService.createExpedition(dto)
  }
}
