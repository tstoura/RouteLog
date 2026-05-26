import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { ClubsService } from '../clubs/clubs.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

const BCRYPT_ROUNDS = 10

/** Safe user fields returned in every auth response. Never includes passwordHash. */
export type AuthUserResponse = {
  id: string
  email: string
  firstName: string
  lastName: string
  systemRole: string
  onboardingCompleted: boolean
  memberships: Array<{
    clubId: string
    clubName: string
    role: string
  }>
}

/** Shape returned by register and login endpoints. */
export type AuthResponse = {
  accessToken: string
  user: AuthUserResponse
}

/** JWT payload stored inside the signed token. */
export type JwtPayload = {
  sub: string       // userId
  email: string
  systemRole: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clubsService: ClubsService,
    private readonly jwt: JwtService,
  ) {}

  // ── Register ───────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponse> {
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
        // super_admin and club_admin are assigned via seed or manual DB edit.
        systemRole: 'user',
        preferredActivity: null,
        onboardingCompleted: false,
        ...(dto.clubId
          ? {
              memberships: {
                create: {
                  clubId: dto.clubId,
                  // Role is always "member" at registration.
                  role: 'member',
                },
              },
            }
          : {}),
      },
    })

    return this.buildAuthResponse(user.id)
  }

  // ── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    // Generic 401 — do not reveal whether the email exists.
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password.')
    }

    return this.buildAuthResponse(user.id)
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
      onboardingCompleted: user.onboardingCompleted,
      memberships: memberships.map((m) => ({
        clubId: m.clubId,
        clubName: m.club.name,
        role: m.role,
      })),
    }
  }

  // ── JWT helpers ────────────────────────────────────────────────────────────

  /**
   * Builds the full AuthResponse for a user id.
   * Fetches the user + memberships, constructs the safe response, signs the JWT.
   */
  private async buildAuthResponse(userId: string): Promise<AuthResponse> {
    const userRecord = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!userRecord) throw new NotFoundException('User not found after creation.')

    const memberships = await this.clubsService.getMembershipsForUser(userId)

    const userResponse: AuthUserResponse = {
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      systemRole: userRecord.systemRole,
      onboardingCompleted: userRecord.onboardingCompleted,
      memberships: memberships.map((m) => ({
        clubId: m.clubId,
        clubName: m.club.name,
        role: m.role,
      })),
    }

    const payload: JwtPayload = {
      sub: userRecord.id,
      email: userRecord.email,
      systemRole: userRecord.systemRole,
    }

    const accessToken = this.jwt.sign(payload)

    return { accessToken, user: userResponse }
  }

  /**
   * Verifies a JWT string and returns the decoded payload.
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
}
