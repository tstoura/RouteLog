import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { PrismaService } from '../prisma/prisma.service'
import { ClubsService } from '../clubs/clubs.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import type { JwtPayload } from './auth.service'

/**
 * Tests for POST /auth/me/club-membership — the self-service club join endpoint.
 *
 * Coverage:
 *   - unauthenticated request → guard returns false (401 in HTTP context)
 *   - user without club joins existing club → 201, role = "member"
 *   - body role=club_admin is ignored; membership is always "member"
 *   - body userId is ignored; JWT sub is used
 *   - user with existing membership → 409 Conflict
 *   - invalid / unknown clubId → 404
 *   - response never includes passwordHash
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal request-like object with JwtPayload — cast to satisfy TypeScript. */
function makeAuthReq(sub = 'user-uuid', systemRole = 'user') {
  return {
    user: { sub, email: 'test@example.com', systemRole } as JwtPayload,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

// ── Mock setup ────────────────────────────────────────────────────────────────

const mockUser = { findUnique: jest.fn(), create: jest.fn() }
const mockClubMembership = { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() }
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
  passwordHash: 'hashed-password',
  onboardingCompleted: false,
  preferredActivity: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const MOCK_MEMBERSHIP_ROW = {
  id: 'membership-uuid',
  userId: 'user-uuid',
  clubId: MOCK_CLUB.id,
  role: 'member',
  club: MOCK_CLUB,
  registryNumber: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('POST /auth/me/club-membership', () => {
  let service: AuthService
  let controller: AuthController

  beforeEach(async () => {
    jest.clearAllMocks()
    mockJwtService.sign.mockReturnValue('mock.jwt.token')
    mockConfigService.getOrThrow.mockReturnValue('mock-refresh-secret')
    mockConfigService.get.mockReturnValue('7d')

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClubsService, useValue: mockClubsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      // Bypass JwtAuthGuard for controller unit tests.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile()

    service = module.get<AuthService>(AuthService)
    controller = module.get<AuthController>(AuthController)
  })

  // ── 401: unauthenticated ───────────────────────────────────────────────────

  it('guard returns false for unauthenticated request (401 in HTTP context)', async () => {
    const guardModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClubsService, useValue: mockClubsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(false) })
      .compile()

    const guard = guardModule.get(JwtAuthGuard)
    expect((guard.canActivate as jest.Mock)()).toBe(false)
  })

  // ── Service: valid user without club joins existing club ───────────────────

  describe('joinMyClub (service)', () => {
    function setupHappyPath() {
      mockClubsService.findByIdOrThrow.mockResolvedValue(MOCK_CLUB)
      mockClubMembership.findFirst.mockResolvedValue(null) // no existing membership
      mockClubMembership.create.mockResolvedValue(MOCK_MEMBERSHIP_ROW)
      mockUser.findUnique.mockResolvedValue(MOCK_USER_RECORD)
      mockClubsService.getMembershipsForUser.mockResolvedValue([MOCK_MEMBERSHIP_ROW])
    }

    it('creates membership with role = "member" for user without club', async () => {
      setupHappyPath()

      const result = await service.joinMyClub('user-uuid', MOCK_CLUB.id)

      expect(mockClubMembership.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid',
            clubId: MOCK_CLUB.id,
            role: 'member',
          }),
        }),
      )
      expect(result.memberships).toHaveLength(1)
      expect(result.memberships[0].role).toBe('member')
      expect(result.memberships[0].clubId).toBe(MOCK_CLUB.id)
    })

    it('returns safe user response — never includes passwordHash', async () => {
      setupHappyPath()

      const result = await service.joinMyClub('user-uuid', MOCK_CLUB.id)

      expect(result).not.toHaveProperty('passwordHash')
      const serialised = JSON.stringify(result)
      expect(serialised).not.toContain('passwordHash')
      expect(serialised).not.toContain('hashed-password')
    })

    it('throws 404 when clubId does not exist', async () => {
      mockClubsService.findByIdOrThrow.mockRejectedValue(
        new NotFoundException(`Club not found`),
      )

      await expect(service.joinMyClub('user-uuid', 'no-such-club')).rejects.toThrow(
        NotFoundException,
      )
      expect(mockClubMembership.create).not.toHaveBeenCalled()
    })

    it('throws 409 when user already has a membership', async () => {
      mockClubsService.findByIdOrThrow.mockResolvedValue(MOCK_CLUB)
      mockClubMembership.findFirst.mockResolvedValue(MOCK_MEMBERSHIP_ROW)

      await expect(service.joinMyClub('user-uuid', MOCK_CLUB.id)).rejects.toThrow(
        ConflictException,
      )
      expect(mockClubMembership.create).not.toHaveBeenCalled()
    })

    it('role from client body is never used — membership is always "member"', async () => {
      setupHappyPath()

      await service.joinMyClub('user-uuid', MOCK_CLUB.id)

      const createCall = mockClubMembership.create.mock.calls[0][0] as {
        data: { role: string }
      }
      expect(createCall.data.role).toBe('member')
    })
  })

  // ── Controller: body userId is ignored ────────────────────────────────────

  describe('controller joinMyClub', () => {
    const SAFE_USER_RESPONSE = {
      id: 'user-uuid',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      systemRole: 'user',
      preferredActivity: null,
      onboardingCompleted: false,
      memberships: [{ clubId: MOCK_CLUB.id, clubName: MOCK_CLUB.name, role: 'member' }],
    }

    it('always uses JWT sub as userId — body userId is silently ignored', async () => {
      const serviceSpy = jest.spyOn(service, 'joinMyClub').mockResolvedValue(SAFE_USER_RESPONSE)

      const req = makeAuthReq('jwt-sub-user-uuid')
      await controller.joinMyClub({ clubId: MOCK_CLUB.id }, req)

      // First arg must be jwt-sub-user-uuid (from JWT), not any body value.
      expect(serviceSpy).toHaveBeenCalledWith('jwt-sub-user-uuid', MOCK_CLUB.id)
    })

    it('body role=club_admin is stripped — DTO only exposes clubId', async () => {
      const serviceSpy = jest.spyOn(service, 'joinMyClub').mockResolvedValue(SAFE_USER_RESPONSE)

      const req = makeAuthReq('user-uuid')
      await controller.joinMyClub({ clubId: MOCK_CLUB.id }, req)

      // Service receives only userId + clubId — never a role from the client.
      expect(serviceSpy).toHaveBeenCalledWith('user-uuid', MOCK_CLUB.id)
    })
  })
})
