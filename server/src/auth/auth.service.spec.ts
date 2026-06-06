import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import type { Response } from 'express'
import { AuthService, REFRESH_COOKIE_NAME } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { ClubsService } from '../clubs/clubs.service'

/**
 * Unit tests for AuthService.
 *
 * Tests cover:
 *   - register: creates user, hashes password, optionally creates membership
 *   - register: rejects duplicate email with 409
 *   - register: rejects unknown clubId with 404
 *   - register: always sets systemRole = "user" (ignores any payload attempt)
 *   - register: result includes accessToken (controller sets cookie — not tested here)
 *   - login: returns token for valid credentials
 *   - login: returns 401 for unknown email
 *   - login: returns 401 for wrong password
 *   - refresh: returns new accessToken for valid refresh JWT
 *   - refresh: returns 401 for invalid/expired refresh JWT
 *   - refresh: returns 401 when user no longer exists
 *   - getMe: returns safe user without passwordHash
 *   - verifyToken: throws 401 for invalid token
 *   - setRefreshCookie: calls res.cookie with correct options
 *   - clearRefreshCookie: calls res.cookie with maxAge: 0
 */

// ── Minimal mock setup ────────────────────────────────────────────────────────

const mockUser = { findUnique: jest.fn(), create: jest.fn() }
const mockClubMembership = { findMany: jest.fn() }
const mockPrisma = { user: mockUser, clubMembership: mockClubMembership }

const mockClubsService = {
  findByIdOrThrow: jest.fn(),
  getMembershipsForUser: jest.fn(),
}

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
}

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('mock-refresh-secret'),
  get: jest.fn().mockReturnValue('7d'),
}

// ── Shared fixtures ───────────────────────────────────────────────────────────

const MOCK_CLUB = { id: 'club-uuid', name: 'ΕΟΣ Πατρών' }

const MOCK_USER_RECORD = {
  id: 'user-uuid',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  systemRole: 'user',
  passwordHash: '',   // set per-test by bcrypt.hash
  onboardingCompleted: false,
  preferredActivity: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const EMPTY_MEMBERSHIPS: never[] = []

const MOCK_MEMBERSHIP = {
  clubId: MOCK_CLUB.id,
  club: MOCK_CLUB,
  role: 'member',
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()
    // Restore default mock return values after per-test overrides.
    mockJwtService.sign.mockReturnValue('mock.jwt.token')
    mockConfigService.getOrThrow.mockReturnValue('mock-refresh-secret')
    mockConfigService.get.mockReturnValue('7d')

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClubsService, useValue: mockClubsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  // ── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    }

    /** Set up the happy-path mock sequence for a no-club registration. */
    function setupHappyPath(email = dto.email) {
      const createdUser = { ...MOCK_USER_RECORD, email }
      // Call 1: duplicate-email check → null (no existing user)
      // Call 2: buildAuthResult → created user record
      mockUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createdUser)
      mockUser.create.mockResolvedValue(createdUser)
      mockClubsService.getMembershipsForUser.mockResolvedValue(EMPTY_MEMBERSHIPS)
    }

    it('creates a user with systemRole = "user"', async () => {
      setupHappyPath()
      const result = await service.register(dto)
      expect(mockUser.create).toHaveBeenCalledTimes(1)
      const createData = mockUser.create.mock.calls[0][0].data
      expect(createData.systemRole).toBe('user')
      expect(result.user.systemRole).toBe('user')
    })

    it('hashes the password before storing', async () => {
      setupHappyPath()
      await service.register(dto)
      const createData = mockUser.create.mock.calls[0][0].data
      expect(createData.passwordHash).toBeDefined()
      expect(createData.passwordHash).not.toBe(dto.password)
      const valid = await bcrypt.compare(dto.password, createData.passwordHash as string)
      expect(valid).toBe(true)
    })

    it('returns accessToken and safe user (no passwordHash)', async () => {
      setupHappyPath()
      const result = await service.register(dto)
      expect(result.accessToken).toBe('mock.jwt.token')
      expect(result.user).not.toHaveProperty('passwordHash')
      expect(result.user.email).toBe(dto.email)
    })

    it('result includes an internal refreshToken field (used by controller for cookie)', async () => {
      setupHappyPath()
      const result = await service.register(dto)
      // refreshToken is returned internally so the controller can set the httpOnly cookie.
      // It must NOT appear in JSON responses — the controller strips it before returning.
      expect(result.refreshToken).toBeDefined()
      expect(typeof result.refreshToken).toBe('string')
    })

    it('throws 409 when email is already registered', async () => {
      mockUser.findUnique.mockResolvedValue(MOCK_USER_RECORD)
      await expect(service.register(dto)).rejects.toThrow(ConflictException)
      expect(mockUser.create).not.toHaveBeenCalled()
    })

    it('throws 404 when clubId does not exist', async () => {
      mockUser.findUnique.mockResolvedValueOnce(null) // no duplicate
      mockClubsService.findByIdOrThrow.mockRejectedValue(
        new NotFoundException('Club not found'),
      )
      await expect(service.register({ ...dto, clubId: 'no-such-club' })).rejects.toThrow(
        NotFoundException,
      )
      expect(mockUser.create).not.toHaveBeenCalled()
    })

    it('creates a ClubMembership with role = "member" when clubId is provided', async () => {
      const createdUser = { ...MOCK_USER_RECORD, email: dto.email }
      mockUser.findUnique
        .mockResolvedValueOnce(null)       // duplicate check
        .mockResolvedValueOnce(createdUser) // buildAuthResult
      mockUser.create.mockResolvedValue(createdUser)
      mockClubsService.findByIdOrThrow.mockResolvedValue(MOCK_CLUB)
      mockClubsService.getMembershipsForUser.mockResolvedValue([MOCK_MEMBERSHIP])

      const result = await service.register({ ...dto, clubId: MOCK_CLUB.id })

      const createData = mockUser.create.mock.calls[0][0].data
      expect(createData.memberships?.create?.role).toBe('member')
      expect(createData.memberships?.create?.clubId).toBe(MOCK_CLUB.id)
      expect(result.user.memberships).toHaveLength(1)
      expect(result.user.memberships[0].role).toBe('member')
    })

    it('does NOT allow systemRole to be set from the payload', async () => {
      setupHappyPath()
      const maliciousDto = { ...dto, systemRole: 'super_admin' } as never
      await service.register(maliciousDto)
      const createData = mockUser.create.mock.calls[0][0].data
      expect(createData.systemRole).toBe('user')
    })
  })

  // ── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('returns accessToken and refreshToken for valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10)
      // findUnique now returns user with memberships included (single query).
      mockUser.findUnique.mockResolvedValue({ ...MOCK_USER_RECORD, passwordHash: hash, memberships: EMPTY_MEMBERSHIPS })

      const result = await service.login({ email: 'test@example.com', password: 'password123' })
      expect(result.accessToken).toBe('mock.jwt.token')
      expect(result.refreshToken).toBeDefined()
      expect(result.user).not.toHaveProperty('passwordHash')
    })

    it('throws 401 when email is not found', async () => {
      mockUser.findUnique.mockResolvedValue(null)
      await expect(
        service.login({ email: 'nobody@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws 401 when password is wrong', async () => {
      const hash = await bcrypt.hash('correctpassword', 10)
      mockUser.findUnique.mockResolvedValue({ ...MOCK_USER_RECORD, passwordHash: hash, memberships: EMPTY_MEMBERSHIPS })
      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  // ── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    const VALID_REFRESH_PAYLOAD = { sub: MOCK_USER_RECORD.id }

    it('returns new accessToken + refreshToken + user for a valid refresh JWT', async () => {
      mockJwtService.verify.mockReturnValue(VALID_REFRESH_PAYLOAD)
      // findUnique now returns user with memberships included (single query).
      mockUser.findUnique.mockResolvedValue({ ...MOCK_USER_RECORD, memberships: EMPTY_MEMBERSHIPS })

      const result = await service.refresh('valid.refresh.token')

      expect(result.accessToken).toBe('mock.jwt.token')
      expect(result.refreshToken).toBeDefined()
      expect(result.user.id).toBe(MOCK_USER_RECORD.id)
      expect(result.user).not.toHaveProperty('passwordHash')
    })

    it('throws 401 when the refresh JWT is invalid or expired', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('expired') })
      await expect(service.refresh('invalid.token')).rejects.toThrow(UnauthorizedException)
    })

    it('throws 401 when the user in the token no longer exists', async () => {
      mockJwtService.verify.mockReturnValue(VALID_REFRESH_PAYLOAD)
      // The existence check in refresh() returns null — user was deleted after token was issued.
      mockUser.findUnique.mockResolvedValueOnce(null)

      await expect(service.refresh('valid.refresh.token')).rejects.toThrow(UnauthorizedException)
    })

    it('uses JWT_REFRESH_SECRET to verify the token', async () => {
      mockJwtService.verify.mockReturnValue(VALID_REFRESH_PAYLOAD)
      mockUser.findUnique.mockResolvedValue({ ...MOCK_USER_RECORD, memberships: EMPTY_MEMBERSHIPS })

      await service.refresh('valid.refresh.token')

      // Verify is called with the refresh secret (not the access secret)
      expect(mockJwtService.verify).toHaveBeenCalledWith(
        'valid.refresh.token',
        expect.objectContaining({ secret: 'mock-refresh-secret' }),
      )
    })

    it('refresh response does not contain refreshToken directly in user object', async () => {
      mockJwtService.verify.mockReturnValue(VALID_REFRESH_PAYLOAD)
      mockUser.findUnique.mockResolvedValue({ ...MOCK_USER_RECORD, memberships: EMPTY_MEMBERSHIPS })

      const result = await service.refresh('valid.refresh.token')

      // The user object must not leak the refresh token.
      const userJson = JSON.stringify(result.user)
      expect(userJson).not.toContain('refreshToken')
      expect(userJson).not.toContain('passwordHash')
    })
  })

  // ── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('returns safe user with memberships', async () => {
      mockUser.findUnique.mockResolvedValue(MOCK_USER_RECORD)
      mockClubsService.getMembershipsForUser.mockResolvedValue([MOCK_MEMBERSHIP])

      const result = await service.getMe(MOCK_USER_RECORD.id)
      expect(result).not.toHaveProperty('passwordHash')
      expect(result.id).toBe(MOCK_USER_RECORD.id)
      expect(result.memberships).toHaveLength(1)
      expect(result.memberships[0].clubName).toBe(MOCK_CLUB.name)
    })

    it('throws 404 when user not found', async () => {
      mockUser.findUnique.mockResolvedValue(null)
      await expect(service.getMe('no-such-user')).rejects.toThrow(NotFoundException)
    })
  })

  // ── verifyToken ───────────────────────────────────────────────────────────

  describe('verifyToken', () => {
    it('returns decoded payload for a valid token', () => {
      const payload = { sub: 'user-uuid', email: 'test@example.com', systemRole: 'user' }
      mockJwtService.verify.mockReturnValue(payload)
      expect(service.verifyToken('valid.token')).toEqual(payload)
    })

    it('throws 401 for an invalid token', () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid') })
      expect(() => service.verifyToken('bad.token')).toThrow(UnauthorizedException)
    })
  })

  // ── setRefreshCookie / clearRefreshCookie ─────────────────────────────────

  describe('setRefreshCookie', () => {
    it('sets an httpOnly cookie with the refresh token', () => {
      const mockRes = { cookie: jest.fn() } as unknown as Response
      service.setRefreshCookie(mockRes, 'some.refresh.token')

      expect(mockRes.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        'some.refresh.token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/auth',
        }),
      )
    })

    it('does NOT use secure flag in non-production environments', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const mockRes = { cookie: jest.fn() } as unknown as Response
      service.setRefreshCookie(mockRes, 'token')

      const cookieOptions = (mockRes.cookie as jest.Mock).mock.calls[0][2] as Record<string, unknown>
      expect(cookieOptions.secure).toBe(false)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('clearRefreshCookie', () => {
    it('clears the cookie by setting maxAge to 0', () => {
      const mockRes = { cookie: jest.fn() } as unknown as Response
      service.clearRefreshCookie(mockRes)

      expect(mockRes.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        '',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/auth',
          maxAge: 0,
        }),
      )
    })
  })
})
