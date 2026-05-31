import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest, Response } from 'express'
import { AuthService, REFRESH_COOKIE_NAME } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JoinClubDto } from './dto/join-club.dto'
import type { AuthResponse, AuthUserResponse, JwtPayload } from './auth.service'

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
   * - Sets an httpOnly refresh-token cookie (routelog_refresh_token).
   * - Returns { accessToken, user } — refreshToken is NOT in the JSON body.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(dto)
    this.authService.setRefreshCookie(res, result.refreshToken)
    return { accessToken: result.accessToken, user: result.user }
  }

  /**
   * POST /auth/login
   *
   * Validates email + password, returns { accessToken, user }.
   * - Returns 401 with a generic message on invalid credentials.
   * - Sets an httpOnly refresh-token cookie (routelog_refresh_token).
   * - refreshToken is NOT in the JSON body.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(dto)
    this.authService.setRefreshCookie(res, result.refreshToken)
    return { accessToken: result.accessToken, user: result.user }
  }

  /**
   * POST /auth/refresh
   *
   * Exchanges the httpOnly refresh-token cookie for a new access token.
   * - Reads routelog_refresh_token from cookies.
   * - Returns 401 if the cookie is missing, invalid, or expired.
   * - Issues a new access token (and rotates the refresh cookie).
   * - Returns { accessToken, user }.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const refreshToken: string | undefined = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE_NAME]
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token.')
    }

    const result = await this.authService.refresh(refreshToken)
    // Rotate the refresh cookie on every successful refresh.
    this.authService.setRefreshCookie(res, result.refreshToken)
    return { accessToken: result.accessToken, user: result.user }
  }

  /**
   * POST /auth/logout
   *
   * Clears the refresh-token cookie.
   * - Safe to call even if no cookie exists.
   * - Returns { ok: true }.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    this.authService.clearRefreshCookie(res)
    return { ok: true }
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

  /**
   * POST /auth/me/club-membership
   *
   * Declares club membership for the currently authenticated user.
   * - Requires: Authorization: Bearer <token> (401 without token).
   * - Body: { clubId: string (UUID) }
   * - Role is always "member" — the client cannot elevate to club_admin or super_admin.
   * - userId is taken from the JWT; any userId in the body is ignored.
   * - Returns 404 if clubId does not exist.
   * - Returns 409 if the user already has a membership (MVP: one club per user).
   * - Returns the updated safe user object (same shape as GET /auth/me).
   * - Never returns passwordHash.
   */
  @Post('me/club-membership')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  joinMyClub(
    @Body() dto: JoinClubDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<AuthUserResponse> {
    return this.authService.joinMyClub(req.user.sub, dto.clubId)
  }
}
