import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { ClubsService } from './clubs.service'
import { CreateClubDto } from './dto/create-club.dto'
import { CreateMembershipDto } from './dto/create-membership.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { JwtPayload } from '../auth/auth.service'

/**
 * NOTE: All endpoints here are currently UNPROTECTED for development convenience.
 * A later auth/authorization phase will add JWT guards and role checks:
 *   POST /clubs                      → restricted to super_admin
 *   GET  /clubs                      → authenticated users
 *   GET  /clubs/:id                  → authenticated users
 *   GET  /clubs/:id/members          → club_admin of that club or super_admin
 *   POST /clubs/:id/members          → club_admin of that club or super_admin
 */
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  /** Create a club — will be restricted to super_admin once auth guards are in place. */
  @Post()
  create(@Body() dto: CreateClubDto) {
    return this.clubsService.create(dto)
  }

  @Get()
  findAll() {
    return this.clubsService.findAll()
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubsService.findByIdOrThrow(id)
  }

  /**
   * List club members for export selection.
   *
   * Auth:  JWT required (401 without token).
   * Authz: super_admin OR club_admin of the requested club (403 otherwise).
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  async getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const caller = req.user
    if (caller.systemRole !== 'super_admin') {
      const isAdmin = await this.clubsService.isClubAdmin(caller.sub, id)
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only club admins or super admins can list club members.',
        )
      }
    }
    return this.clubsService.getClubMembersForExport(id)
  }

  /**
   * List official activities for a club (admin view).
   *
   * Auth:  JWT required (401 without token).
   * Authz: super_admin OR club_admin of the requested club (403 otherwise).
   *
   * Returns all is_official = true activities ordered by date desc.
   * Each item includes the submitting user's basic info.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/activities')
  async getClubActivities(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const caller = req.user
    if (caller.systemRole !== 'super_admin') {
      const isAdmin = await this.clubsService.isClubAdmin(caller.sub, id)
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only club admins or super admins can view club activities.',
        )
      }
    }
    return this.clubsService.getClubOfficialActivities(id)
  }

  /**
   * Add a user to a club.
   * Body: { userId, role, registryNumber? }
   * Returns a 409 if the user is already a member of this club.
   */
  @Post(':id/members')
  createMembership(
    @Param('id', ParseUUIDPipe) clubId: string,
    @Body() dto: CreateMembershipDto,
  ) {
    return this.clubsService.createMembership(clubId, dto)
  }
}
