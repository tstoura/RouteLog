import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ClubsService } from './clubs.service'
import { CreateClubDto } from './dto/create-club.dto'
import { CreateMembershipDto } from './dto/create-membership.dto'

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

  /** List all members of a club with their membership roles. */
  @Get(':id/members')
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubsService.getMembershipsForClub(id)
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
