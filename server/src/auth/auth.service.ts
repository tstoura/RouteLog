import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import type { Response } from 'express'
import { PrismaService } from '../prisma/prisma.service'
import { ClubsService } from '../clubs/clubs.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

const BCRYPT_ROUNDS = 10

// ── Refresh cookie constants ─────────────────────────────────────────────────

export const REFRESH_COOKIE_NAME = 'routelog_refresh_token'

/** 7 days in milliseconds — matches the default JWT_REFRESH_EXPIRES_IN. */
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

// ── Public types ─────────────────────────────────────────────────────────────

/** Safe user fields returned in every auth response. Never includes passwordHash. */
export type AuthUserResponse = {
  id: string
  email: string
  firstName: string
  lastName: string
  systemRole: string
  preferredActivity: string | null
  onboardingCompleted: boolean
  memberships: Array<{
    clubId: string
    clubName: string
    role: string
  }>
}

/** Shape returned to API consumers (no refreshToken in JSON). */
export type AuthResponse = {
  accessToken: string
  user: AuthUserResponse
}

/** JWT payload stored inside the signed access token. */
export type JwtPayload = {
  sub: string       // userId
  email: string
  systemRole: string
}

// ── Internal type (service → controller only, never serialised to JSON) ──────

type AuthServiceResult = AuthResponse & {
  /** Signed refresh JWT. Controller sets this as an httpOnly cookie; never sent in JSON. */
  refreshToken: string
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clubsService: ClubsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── Register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthServiceResult> {
    // Check for duplicate email.
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) {
      throw new ConflictException(`Email "${dto.email}" is already registered.`)
    }

    // Validate club if provided.
    if (dto.clubId) {
      await this.clubsService.findByIdOrThrow(dto.clubId)
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)

    // Create user + optional membership in a single transaction.
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        // systemRole is always "user" at registration.
        systemRole: 'user',
        preferredActivity: dto.preferredActivity ?? null,
        onboardingCompleted: false,
        ...(dto.clubId
          ? {
              memberships: {
                create: {
                  clubId: dto.clubId,
                  role: 'member',
                },
              },
            }
          : {}),
      },
    })

    return this.buildAuthResult(user.id)
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthServiceResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    // Generic 401 — do not reveal whether the email exists.
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    return this.buildAuthResult(user.id)
  }

  // ── Refresh ────────────────────────────────────────────────────────────────

  /**
   * Validates a refresh JWT and issues a new access token + refresh token.
   * The caller (controller) is responsible for reading the cookie and setting the new one.
   */
  async refresh(refreshToken: string): Promise<AuthServiceResult> {
    let payload: { sub: string }
    try {
      payload = this.jwt.verify<{ sub: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }

    // Ensure user still exists (not deleted since the token was issued).
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) {
      throw new UnauthorizedException('User no longer exists.')
    }

    return this.buildAuthResult(payload.sub)
  }

  // ── Get current user (for /auth/me) ───────────────────────────────────────

  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found.`)
    }

    const memberships = await this.clubsService.getMembershipsForUser(userId)

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      systemRole: user.systemRole,
      preferredActivity: user.preferredActivity,
      onboardingCompleted: user.onboardingCompleted,
      memberships: memberships.map((m) => ({
        clubId: m.clubId,
        clubName: m.club.name,
        role: m.role,
      })),
    }
  }

  // ── Join club (POST /auth/me/club-membership) ─────────────────────────────

  /**
   * Allows an authenticated user to declare membership in one existing club.
   *
   * Business rules enforced here:
   *   - Club must exist (404 if not found).
   *   - User must not already have any membership (MVP: at most one club → 409).
   *   - Role is always "member". The client cannot elevate to club_admin or super_admin.
   *   - userId is always taken from the JWT (never from the request body).
   *
   * Returns the updated safe user object (same shape as getMe / AuthUserResponse).
   */
  async joinMyClub(userId: string, clubId: string): Promise<AuthUserResponse> {
    // Validate club exists — throws 404 if not found.
    await this.clubsService.findByIdOrThrow(clubId)

    // MVP: a user belongs to at most one club.
    const existingMembership = await this.prisma.clubMembership.findFirst({
      where: { userId },
    })
    if (existingMembership) {
      throw new ConflictException(
        'Ανήκετε ήδη σε σύλλογο. Δεν είναι δυνατή η εγγραφή σε δεύτερο σύλλογο.',
      )
    }

    // Create membership — role is always "member", never from client input.
    await this.prisma.clubMembership.create({
      data: {
        userId,
        clubId,
        role: 'member',
      },
    })

    // Return the updated safe user (re-uses getMe which fetches fresh memberships).
    return this.getMe(userId)
  }

  // ── Cookie helpers (called by AuthController) ─────────────────────────────

  /**
   * Sets the httpOnly refresh-token cookie on the Express response.
   * - httpOnly: JavaScript cannot read it.
   * - sameSite: "none" in production so the cookie is sent cross-site when the
   *   frontend (Vercel) and backend (Render) are on different domains.
   *   "lax" in development — works fine for same-origin local setup.
   * - secure: true in production (required when sameSite is "none"); false locally.
   * - path: "/auth" — cookie is only sent to /auth/* routes.
   */
  setRefreshCookie(res: Response, refreshToken: string): void {
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/auth',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    })
  }

  /**
   * Clears the refresh-token cookie.
   * Must use the same path/options as setRefreshCookie so the browser removes it.
   */
  clearRefreshCookie(res: Response): void {
    const isProd = process.env.NODE_ENV === 'production'
    res.cookie(REFRESH_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/auth',
      maxAge: 0,
    })
  }

  // ── JWT helpers ────────────────────────────────────────────────────────────

  /**
   * Verifies an access JWT string and returns the decoded payload.
   * Throws UnauthorizedException if the token is invalid or expired.
   * Used by JwtAuthGuard.
   */
  verifyToken(token: string): JwtPayload {
    try {
      return this.jwt.verify<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token.')
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Builds the full auth result for a user id.
   * Fetches user + memberships, signs both tokens.
   * The caller (controller) decides which fields to send in the JSON response.
   * refreshToken must never appear in the JSON body — only in the httpOnly cookie.
   */
  private async buildAuthResult(userId: string): Promise<AuthServiceResult> {
    const userRecord = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!userRecord) throw new NotFoundException('User not found.')

    const memberships = await this.clubsService.getMembershipsForUser(userId)

    const userResponse: AuthUserResponse = {
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      systemRole: userRecord.systemRole,
      preferredActivity: userRecord.preferredActivity,
      onboardingCompleted: userRecord.onboardingCompleted,
      memberships: memberships.map((m) => ({
        clubId: m.clubId,
        clubName: m.club.name,
        role: m.role,
      })),
    }

    const accessPayload: JwtPayload = {
      sub: userRecord.id,
      email: userRecord.email,
      systemRole: userRecord.systemRole,
    }

    // Access token — short-lived, signed with JWT_SECRET (JwtModule default).
    const accessToken = this.jwt.sign(accessPayload)

    // Refresh token — longer-lived, signed with JWT_REFRESH_SECRET.
    const refreshToken = this.jwt.sign(
      { sub: userRecord.id },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
      },
    )

    return { accessToken, refreshToken, user: userResponse }
  }
}
