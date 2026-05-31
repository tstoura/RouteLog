import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import { ActivitiesService } from './activities.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/auth.service'
import { CreateHikingActivityDto } from './dto/create-hiking-activity.dto'
import { CreateClimbingActivityDto } from './dto/create-climbing-activity.dto'
import { CreateExpeditionActivityDto } from './dto/create-expedition-activity.dto'
import { PatchActivityDto } from './dto/patch-activity.dto'
import { GetActivitiesDto } from './dto/get-activities.dto'
import { PreviewPointsDto } from './dto/preview-points.dto'

type AuthRequest = ExpressRequest & { user: JwtPayload }

/**
 * Phase 11C: all activity endpoints are now protected by JwtAuthGuard.
 *
 * The only trusted userId is req.user.sub — extracted from the verified JWT.
 * Any userId or clubId present in the request body or query string is
 * IGNORED (kept for backward compat while frontend still sends DEV_USER_ID).
 *
 * TODO (Phase 11E): once frontend stops sending DEV_USER_ID / DEV_CLUB_ID,
 * remove userId and clubId from all activity DTOs.
 *
 * Official activity clubId is inferred from the user's ClubMembership in the
 * service layer — never taken from the request body.
 */
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // ── Retrieval ─────────────────────────────────────────────────────────────

  /**
   * GET /activities
   *
   * List activities for the authenticated user, optionally filtered by category.
   *
   * Query parameters:
   *   userId   — ignored (backward compat); real userId comes from JWT.
   *   category — optional; "hiking" | "climbing" | "expedition"
   *   take     — page size, default 20, max 100
   *   skip     — offset, default 0
   *
   * Returns an array ordered by date descending.
   * Returns 401 if no valid Bearer token is provided.
   */
  @Get()
  findAllForUser(@Query() dto: GetActivitiesDto, @Request() req: AuthRequest) {
    return this.activitiesService.findAllForUser(dto, req.user.sub)
  }

  /**
   * GET /activities/:id
   *
   * Get a single activity by UUID.
   * Returns 401 if not authenticated.
   * Returns 404 if:
   *   - The activity does not exist.
   *   - The activity exists but belongs to a different user.
   *     (404 rather than 403 to avoid leaking ownership info.)
   */
  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.activitiesService.findById(id, req.user.sub)
  }

  // ── Creation ──────────────────────────────────────────────────────────────

  /**
   * POST /activities/preview-points
   *
   * Compute a live EOOA points preview for the given category payload.
   * No database writes are performed.
   *
   * The payload may be incomplete (user is still filling the form).
   * Returns 200 with { points: null, isReady: false } for incomplete data.
   * Returns 200 with { points: "10.25", isReady: true } when fully computable.
   * Returns 400 if category is unknown or the body is malformed.
   * Returns 401 if not authenticated.
   */
  @Post('preview-points')
  previewPoints(@Body() dto: PreviewPointsDto) {
    return this.activitiesService.previewPoints(dto)
  }

  /**
   * POST /activities/hiking
   *
   * Submit a Hiking / Ski Mountaineering activity.
   * Activity is created for the authenticated user (req.user.sub).
   * Any userId in the body is ignored.
   *
   * Official: clubId is inferred from the user's ClubMembership.
   *   Returns 422 if the user has no club membership.
   *   Returns 422 if the user has multiple memberships (MVP limitation).
   *
   * Returns 201 Created with the full activity + hikingDetail.
   * Returns 400 if DTO validation fails.
   * Returns 401 if not authenticated.
   * Returns 422 if official fields fail EOOA rules or scoring fails.
   */
  @Post('hiking')
  createHiking(@Body() dto: CreateHikingActivityDto, @Request() req: AuthRequest) {
    return this.activitiesService.createHiking(dto, req.user.sub)
  }

  /**
   * POST /activities/climbing
   *
   * Submit a Rock Climbing activity.
   * Activity is created for the authenticated user (req.user.sub).
   *
   * The route_id must reference an existing route. The service snapshots
   * routeName, mountainOrArea, and climbingField from the canonical Route.
   *
   * Official: clubId is inferred from the user's ClubMembership.
   *
   * Returns 201 Created with the full activity + climbingDetail.
   * Returns 400 if DTO validation fails.
   * Returns 401 if not authenticated.
   * Returns 404 if routeId does not exist.
   * Returns 422 if official fields fail EOOA rules, French grade has no mapping,
   *             or scoring fails.
   */
  @Post('climbing')
  createClimbing(@Body() dto: CreateClimbingActivityDto, @Request() req: AuthRequest) {
    return this.activitiesService.createClimbing(dto, req.user.sub)
  }

  /**
   * POST /activities/expedition
   *
   * Submit an Expeditions Abroad activity.
   * Activity is created for the authenticated user (req.user.sub).
   *
   * Official: clubId is inferred from the user's ClubMembership.
   *
   * Returns 201 Created with the full activity + expeditionDetail.
   * Returns 400 if DTO validation fails.
   * Returns 401 if not authenticated.
   * Returns 422 if official fields fail EOOA rules or scoring fails.
   */
  @Post('expedition')
  createExpedition(@Body() dto: CreateExpeditionActivityDto, @Request() req: AuthRequest) {
    return this.activitiesService.createExpedition(dto, req.user.sub)
  }

  // ── Edit / Delete ─────────────────────────────────────────────────────────

  /**
   * PATCH /activities/:id
   *
   * Partially update an activity owned by the authenticated user.
   *
   * MVP immutable fields (category, isOfficial, userId, clubId, createdAt,
   * and routeId for climbing) are NOT accepted in the request body. The global
   * ValidationPipe will reject them with 400 before this handler is called.
   *
   * Only the fields present in the body are changed; all other fields keep
   * their existing stored values (merge semantics).
   *
   * Official activities: EOOA rules are re-validated against the merged
   * field values and points are recalculated.
   * Personal activities: flexible validation; points remain null.
   *
   * Returns 200 with the updated activity + detail.
   * Returns 400 if DTO validation fails (e.g. invalid type or immutable field sent).
   * Returns 401 if not authenticated.
   * Returns 404 if the activity does not exist or belongs to a different user.
   * Returns 422 if official EOOA validation fails after the merge.
   */
  @Patch(':id')
  patchActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchActivityDto,
    @Request() req: AuthRequest,
  ) {
    return this.activitiesService.patchActivity(id, dto, req.user.sub)
  }

  /**
   * DELETE /activities/:id
   *
   * Hard-delete an activity owned by the authenticated user.
   * The category-specific detail row is deleted in the same transaction.
   *
   * Returns 200 { ok: true } on success.
   * Returns 401 if not authenticated.
   * Returns 404 if the activity does not exist or belongs to a different user.
   */
  @Delete(':id')
  @HttpCode(200)
  deleteActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthRequest,
  ) {
    return this.activitiesService.deleteActivity(id, req.user.sub)
  }
}
