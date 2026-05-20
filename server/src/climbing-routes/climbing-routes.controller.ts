import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common'
import { ClimbingRoutesService } from './climbing-routes.service'
import { CreateRouteDto } from './dto/create-route.dto'
import { SearchRoutesDto } from './dto/search-routes.dto'

/**
 * NOTE: All endpoints here are currently UNPROTECTED for development convenience.
 * A later auth/authorization phase will add JWT guards and role checks:
 *   POST /climbing-routes       → any authenticated user (create route)
 *   GET  /climbing-routes       → any authenticated user (search)
 *   GET  /climbing-routes/:id   → any authenticated user
 *   Route editing (PATCH/PUT)   → super_admin only (not implemented in MVP)
 */
@Controller('climbing-routes')
export class ClimbingRoutesController {
  constructor(private readonly climbingRoutesService: ClimbingRoutesService) {}

  /**
   * Create a new climbing route.
   * Returns 409 Conflict if a route with the same normalized name,
   * mountain/area, and climbing field already exists. The response body
   * includes the existing route's id and key fields.
   */
  @Post()
  create(@Body() dto: CreateRouteDto) {
    return this.climbingRoutesService.create(dto)
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
}
