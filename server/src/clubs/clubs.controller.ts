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
 * Auth / Authz summary (Phase 11I):
 *   POST /clubs                      → JWT required; super_admin only (403 otherwise)
 *   GET  /clubs                      → public (used by register dropdown)
 *   GET  /clubs/:id                  → public
 *   GET  /clubs/:id/members          → JWT required; super_admin OR club_admin of that club
 *   GET  /clubs/:id/activities       → JWT required; super_admin OR club_admin of that club
 *   POST /clubs/:id/members          → JWT required; super_admin OR club_admin of that club
 */
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  /**
   * Create a new club.
   *
   * Auth:  JWT required (401 without token).
   * Authz: super_admin only (403 for all other roles).
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() dto: CreateClubDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    if (req.user.systemRole !== 'super_admin') {
      throw new ForbiddenException('Only super_admin can create clubs.')
    }
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
   *
   * Auth:  JWT required (401 without token).
   * Authz: super_admin OR club_admin of the target club (403 otherwise).
   *
   * Body: { userId, role, registryNumber? }
   * - role must be "member" or "club_admin" (validated by DTO).
   * - does NOT change the target user's systemRole.
   * Returns a 409 if the user is already a member of this club.
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/members')
  async createMembership(
    @Param('id', ParseUUIDPipe) clubId: string,
    @Body() dto: CreateMembershipDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const caller = req.user
    if (caller.systemRole !== 'super_admin') {
      const isAdmin = await this.clubsService.isClubAdmin(caller.sub, clubId)
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only club_admin of this club or super_admin can add members.',
        )
      }
    }
    return this.clubsService.createMembership(clubId, dto)
  }
}
