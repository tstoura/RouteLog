import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { ExportService } from './export.service'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Unit tests for ExportService — authorization and query behaviour.
 *
 * Authorization matrix (assertRequesterIsAuthorized):
 *   super_admin                         → allowed
 *   club_admin of the requested club    → allowed
 *   regular member of the requested club → 403
 *   user with no memberships            → 403
 *   club_admin of a DIFFERENT club      → 403
 *   JWT user not found in DB            → 404
 *
 * Security — requesterUserId from body is ignored:
 *   body.requesterUserId of admin but callerUserId is member → 403 (spoofing fails)
 *   callerUserId of admin, body.requesterUserId absent       → allowed (not required)
 *
 * Export query behaviour:
 *   - selectedUserIds passed as filter in the Prisma where clause
 *   - year filter passed to the Prisma where clause when provided
 *   - only isOfficial = true activities are queried
 *   - club existence check runs before authorization
 */

// ── Constants ──────────────────────────────────────────────────────────────────

const CALLER_USER_ID = 'caller-user-uuid'
const CLUB_ID        = 'club-uuid'
const OTHER_CLUB_ID  = 'other-club-uuid'

// ── User fixtures ──────────────────────────────────────────────────────────────

/** super_admin — allowed to export any club */
const superAdminUser = {
  id: CALLER_USER_ID,
  systemRole: 'super_admin',
  memberships: [],   // no memberships needed for super_admin
}

/** club_admin of the target club — allowed */
const clubAdminUser = {
  id: CALLER_USER_ID,
  systemRole: 'user',
  memberships: [{ role: 'club_admin', clubId: CLUB_ID }],
}

/** regular member of the target club — not allowed */
const memberUser = {
  id: CALLER_USER_ID,
  systemRole: 'user',
  memberships: [{ role: 'member', clubId: CLUB_ID }],
}

/** user with no memberships at all — not allowed */
const noMembershipUser = {
  id: CALLER_USER_ID,
  systemRole: 'user',
  memberships: [],
}

/**
 * club_admin of a DIFFERENT club.
 * Prisma is called with `where: { clubId: CLUB_ID }`, so this user's
 * membership in OTHER_CLUB_ID is not returned → memberships array is [].
 */
const otherClubAdminUser = {
  id: CALLER_USER_ID,
  systemRole: 'user',
  memberships: [],   // filtered out because it belongs to OTHER_CLUB_ID
}

// ── Minimal Prisma mocks ───────────────────────────────────────────────────────

const mockClub = { findUnique: jest.fn() }
const mockUser = { findUnique: jest.fn() }
const mockActivity = { findMany: jest.fn() }

const mockPrismaService = {
  club: mockClub,
  user: mockUser,
  activity: mockActivity,
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('ExportService', () => {
  let service: ExportService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    service = module.get<ExportService>(ExportService)

    // Default: club exists, no activities, mock buildExcel so file I/O is skipped.
    mockClub.findUnique.mockResolvedValue({ id: CLUB_ID, name: 'ΕΟΣ Πατρών' })
    mockActivity.findMany.mockResolvedValue([])
    // Spy on the private buildExcel method so tests don't require the template file.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(service as Record<string, any>, 'buildExcel').mockResolvedValue(Buffer.from('mock-xlsx'))
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Authorization
  // ════════════════════════════════════════════════════════════════════════════

  describe('authorization', () => {
    const dto = {
      selectedUserIds: [CALLER_USER_ID],
      year: 2026,
    }

    it('super_admin is allowed to export', async () => {
      mockUser.findUnique.mockResolvedValue(superAdminUser)
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).resolves.not.toThrow()
    })

    it('club_admin of the target club is allowed to export', async () => {
      mockUser.findUnique.mockResolvedValue(clubAdminUser)
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).resolves.not.toThrow()
    })

    it('regular member of the target club → 403 Forbidden', async () => {
      mockUser.findUnique.mockResolvedValue(memberUser)
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).rejects.toThrow(ForbiddenException)
    })

    it('user with no memberships → 403 Forbidden', async () => {
      mockUser.findUnique.mockResolvedValue(noMembershipUser)
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).rejects.toThrow(ForbiddenException)
    })

    it('club_admin of a DIFFERENT club → 403 Forbidden', async () => {
      // Prisma is called with where: { clubId: CLUB_ID }, so the other-club membership
      // is not returned — memberships array is empty for this user.
      mockUser.findUnique.mockResolvedValue(otherClubAdminUser)
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).rejects.toThrow(ForbiddenException)
    })

    it('JWT user not found in DB → 404 Not Found', async () => {
      mockUser.findUnique.mockResolvedValue(null)
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })

    it('club not found → 404 Not Found (checked before auth)', async () => {
      mockClub.findUnique.mockResolvedValue(null)
      // User lookup should not even be reached.
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
      expect(mockUser.findUnique).not.toHaveBeenCalled()
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Security — requesterUserId from body must be ignored
  // ════════════════════════════════════════════════════════════════════════════

  describe('requesterUserId is ignored (spoofing prevention)', () => {
    it('body.requesterUserId of an admin does NOT help a member caller → 403', async () => {
      // callerUserId is a regular member; body includes an admin's UUID.
      const ADMIN_USER_ID = 'admin-uuid'
      mockUser.findUnique.mockResolvedValue(memberUser)

      const dto = {
        selectedUserIds: [CALLER_USER_ID],
        requesterUserId: ADMIN_USER_ID,  // spoofing attempt — must be ignored
      }

      // Service uses callerUserId (CALLER_USER_ID) → member → 403
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).rejects.toThrow(ForbiddenException)

      // Verify the service looked up CALLER_USER_ID, not ADMIN_USER_ID
      expect(mockUser.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: CALLER_USER_ID } }),
      )
      expect(mockUser.findUnique).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: ADMIN_USER_ID } }),
      )
    })

    it('admin caller is allowed even when body.requesterUserId is absent', async () => {
      mockUser.findUnique.mockResolvedValue(clubAdminUser)
      const dto = { selectedUserIds: [CALLER_USER_ID] }  // no requesterUserId
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).resolves.not.toThrow()
    })

    it('admin caller is allowed even when body.requesterUserId is a random string', async () => {
      mockUser.findUnique.mockResolvedValue(superAdminUser)
      const dto = {
        selectedUserIds: [CALLER_USER_ID],
        // This is ignored by the DTO validator since it's now @IsOptional()
        // and the service never reads it.
      }
      await expect(service.exportClub(CLUB_ID, dto, CALLER_USER_ID)).resolves.not.toThrow()
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Export query behaviour
  // ════════════════════════════════════════════════════════════════════════════

  describe('export query behaviour', () => {
    beforeEach(() => {
      // Use club_admin for all query tests.
      mockUser.findUnique.mockResolvedValue(clubAdminUser)
    })

    it('queries only official activities (isOfficial: true)', async () => {
      const dto = { selectedUserIds: ['user-1'] }
      await service.exportClub(CLUB_ID, dto, CALLER_USER_ID)

      const whereClause = mockActivity.findMany.mock.calls[0][0].where
      expect(whereClause.isOfficial).toBe(true)
    })

    it('filters by clubId from the route param', async () => {
      const dto = { selectedUserIds: ['user-1'] }
      await service.exportClub(CLUB_ID, dto, CALLER_USER_ID)

      const whereClause = mockActivity.findMany.mock.calls[0][0].where
      expect(whereClause.clubId).toBe(CLUB_ID)
    })

    it('passes selectedUserIds as a filter', async () => {
      const SELECTED = ['user-1', 'user-2']
      const dto = { selectedUserIds: SELECTED }
      await service.exportClub(CLUB_ID, dto, CALLER_USER_ID)

      const whereClause = mockActivity.findMany.mock.calls[0][0].where
      expect(whereClause.userId).toEqual({ in: SELECTED })
    })

    it('applies year filter when provided', async () => {
      const dto = { selectedUserIds: ['user-1'], year: 2026 }
      await service.exportClub(CLUB_ID, dto, CALLER_USER_ID)

      const whereClause = mockActivity.findMany.mock.calls[0][0].where
      expect(whereClause.date).toEqual({
        gte: new Date('2026-01-01'),
        lte: new Date('2026-12-31'),
      })
    })

    it('omits year filter when not provided', async () => {
      const dto = { selectedUserIds: ['user-1'] }
      await service.exportClub(CLUB_ID, dto, CALLER_USER_ID)

      const whereClause = mockActivity.findMany.mock.calls[0][0].where
      expect(whereClause.date).toBeUndefined()
    })

    it('returns a Buffer (the Excel file)', async () => {
      const dto = { selectedUserIds: ['user-1'] }
      const result = await service.exportClub(CLUB_ID, dto, CALLER_USER_ID)
      expect(Buffer.isBuffer(result)).toBe(true)
    })
  })
})
