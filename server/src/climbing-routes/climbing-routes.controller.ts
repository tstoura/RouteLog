import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Request, UseGuards } from '@nestjs/common'
import type { Request as ExpressRequest } from 'express'
import { ClimbingRoutesService } from './climbing-routes.service'
import { CreateRouteDto } from './dto/create-route.dto'
import { SearchRoutesDto } from './dto/search-routes.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/auth.service'

type AuthRequest = ExpressRequest & { user: JwtPayload }

/**
 * Auth summary:
 *   POST /climbing-routes       → JWT required; any authenticated user may submit a new route
 *   GET  /climbing-routes       → public (used by the climbing activity form combobox)
 *   GET  /climbing-routes/:id   → public
 *   Route editing (PATCH/PUT)   → super_admin only (not implemented in MVP)
 */
@Controller('climbing-routes')
export class ClimbingRoutesController {
  constructor(private readonly climbingRoutesService: ClimbingRoutesService) {}

  /**
   * Create a new climbing route.
   *
   * Auth: JWT required (401 without token).
   * The authenticated user's id (req.user.sub) is stored as created_by_user_id.
   *
   * Returns 409 Conflict if a route with the same normalized name,
   * mountain/area, and climbing field already exists. The response body
   * includes the existing route's id and key fields.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateRouteDto, @Request() req: AuthRequest) {
    return this.climbingRoutesService.create(dto, req.user.sub)
  }

  /**
   * Search / list climbing routes.
   *
   * Query params (all optional):
   *   q             — partial name search (case-insensitive)
   *   mountainOrArea — filter by area
   *   climbingField  — filter by field
   *   category       — defaults to "climbing"
   *   take           — page size (default 20, max 100)
   *   skip           — offset (default 0)
   */
  @Get()
  search(@Query() dto: SearchRoutesDto) {
    return this.climbingRoutesService.search(dto)
  }

  /** Get a single route by UUID. Returns 404 if not found. */
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.climbingRoutesService.findByIdOrThrow(id)
  }

  /**
   * Returns public activity reviews for the route — climbing activities where
   * publicNotes is non-empty. privateNotes are never included.
   */
  @Get(':id/activity-reviews')
  getActivityReviews(@Param('id', ParseUUIDPipe) id: string) {
    return this.climbingRoutesService.getActivityReviews(id)
  }
}
