import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'

/**
 * NOTE: All endpoints here are currently UNPROTECTED for development convenience.
 * A later auth/authorization phase will add JWT guards and role checks:
 *   GET  /users           → restricted to super_admin
 *   GET  /users/:id       → own profile or super_admin
 *   PATCH /users/:id      → own profile only
 *   GET  /users/:id/memberships → own profile or super_admin
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** List all users — will be restricted to super_admin once auth guards are in place. */
  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findByIdOrThrow(id)
  }

  /**
   * Returns the user's club memberships.
   * An empty array indicates an independent user (no club).
   */
  @Get(':id/memberships')
  getMemberships(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getMemberships(id)
  }

  /** Update preferred_activity or onboardingCompleted. */
  @Patch(':id')
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(id, dto)
  }
}
