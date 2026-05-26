import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import type { JwtPayload } from './auth.service'

type AuthenticatedRequest = Request & { user: JwtPayload }

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   *
   * Creates a new user account.
   * - systemRole is always "user"; cannot be overridden from the payload.
   * - If clubId is provided, creates one ClubMembership with role = "member".
   * - Returns 409 if the email is already registered.
   * - Returns 404 if clubId does not exist.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  /**
   * POST /auth/login
   *
   * Validates email + password, returns a JWT access token.
   * - Returns 401 with a generic message on invalid credentials.
   *   (Does not reveal whether the email exists.)
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  /**
   * GET /auth/me
   *
   * Returns the current authenticated user's profile and memberships.
   * Requires: Authorization: Bearer <token>
   * - Returns 401 if the token is missing, invalid, or expired.
   * - Never returns passwordHash.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.sub)
  }
}
