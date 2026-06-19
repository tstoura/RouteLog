import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { JwtPayload } from '../auth/auth.service'

type AuthRequest = Request & { user: JwtPayload }

/**
 * Auth / Authz summary:
 *   GET  /users           → JWT required; super_admin only (403 otherwise)
 *   GET  /users/:id       → JWT required; own profile or super_admin
 *   GET  /users/:id/memberships → JWT required; own profile or super_admin
 *   PATCH /users/:id      → JWT required; own profile or super_admin
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * List all users.
   * Auth: super_admin only (403 for all other roles).
   */
  @Get()
  findAll(@Req() req: AuthRequest) {
    if (req.user.systemRole !== 'super_admin') {
      throw new ForbiddenException('Only super_admin can list all users.')
    }
    return this.usersService.findAll()
  }

  /**
   * Get a single user by UUID.
   * Auth: own profile or super_admin.
   */
  @Get(':id')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    if (req.user.systemRole !== 'super_admin' && req.user.sub !== id) {
      throw new ForbiddenException('You can only view your own profile.')
    }
    return this.usersService.findByIdOrThrow(id)
  }

  /**
   * Returns the user's club memberships.
   * Auth: own profile or super_admin.
   */
  @Get(':id/memberships')
  getMemberships(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    if (req.user.systemRole !== 'super_admin' && req.user.sub !== id) {
      throw new ForbiddenException('You can only view your own memberships.')
    }
    return this.usersService.getMemberships(id)
  }

  /**
   * Update preferred_activity or onboardingCompleted.
   * Auth: own profile or super_admin.
   */
  @Patch(':id')
  updateProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthRequest,
  ) {
    if (req.user.systemRole !== 'super_admin' && req.user.sub !== id) {
      throw new ForbiddenException('You can only update your own profile.')
    }
    return this.usersService.updateProfile(id, dto)
  }
}
