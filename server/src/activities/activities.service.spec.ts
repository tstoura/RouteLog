import { Test, TestingModule } from '@nestjs/testing'
import { UnprocessableEntityException, NotFoundException } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringService } from '../scoring/scoring.service'
import { ScoringError } from '../scoring/scoring.errors'

/**
 * Unit tests for ActivitiesService.
 *
 * Section A — climbing difficulty validation (cases 1–10 + French F1–F7):
 *   Personal-record difficulty validation, official French-grade mapping/scoring.
 *
 * Section B — JWT ownership and clubId inference (Phase 11C):
 *   - createClimbing uses callerUserId, not dto.userId
 *   - official activities infer clubId from the user's membership
 *   - official without membership → 422
 *   - official with multiple memberships → 422
 *   - personal without membership → succeeds (no membership required)
 *   - findAllForUser returns activities for callerUserId
 *   - findById returns own activity; returns 404 for another user's activity
 *
 * Section C — hiking auth behaviour:
 *   - official hiking uses callerUserId and infers clubId from membership
 *   - official hiking without membership → 422
 *   - personal hiking without membership → succeeds
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const CALLER_USER_ID = '00000000-0000-0000-0000-000000000001'
const OTHER_USER_ID  = '00000000-0000-0000-0000-000000000002'
const CLUB_ID        = 'club-uuid'
const ACTIVITY_ID    = 'activity-uuid'

// ── Minimal mock stubs ────────────────────────────────────────────────────────

const MOCK_ROUTE = {
  id: 'route-uuid',
  name: 'Test Route',
  mountainOrArea: 'Olympus',
  climbingField: 'Metropolis',
}

const MOCK_CLUB = { id: CLUB_ID }

const mockUser = { findUnique: jest.fn() }
const mockRoute = { findUnique: jest.fn() }
const mockClub = { findUnique: jest.fn() }
const mockActivity = { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() }
const mockClubMembership = { findMany: jest.fn() }

const mockPrismaService = {
  user: mockUser,
  route: mockRoute,
  club: mockClub,
  clubMembership: mockClubMembership,
  activity: mockActivity,
}

const mockCalculateClimbingPoints = jest.fn()
const mockResolveClimbingGrade = jest.fn()
const mockCalculateHikingPoints = jest.fn()

const mockScoringService = {
  calculateClimbingPoints: mockCalculateClimbingPoints,
  resolveClimbingGrade: mockResolveClimbingGrade,
  calculateHikingPoints: mockCalculateHikingPoints,
}

// ── Base payloads ─────────────────────────────────────────────────────────────

/** Minimal personal climbing payload. dto.userId / dto.clubId are optional + ignored. */
const basePersonal = {
  routeId: 'route-uuid',
  date: '2026-05-26',
  isOfficial: false as const,
  season: 'summer',
  repetitionType: 'new',
  participantsNum: 1,
}

/** Minimal official climbing payload. dto.clubId is present but will be ignored. */
const baseOfficial = {
  clubId: CLUB_ID,   // backward-compat field — service ignores this
  routeId: 'route-uuid',
  date: '2026-05-26',
  isOfficial: true as const,
  season: 'summer',
  repetitionType: 'new',
  altitude: 1500,
  routeLength: 200,
  participantsNum: 1,
  difficultyScale: 'uiaa',
  difficultyGrade: 'VI',
}

const basePersonalHiking = {
  date: '2026-05-26',
  isOfficial: false as const,
  mountain: 'Ολυμπος',
  maxAltitude: 2918,
  totalElevationGain: 1200,
  distanceLength: 15,
  fieldType: 'normal',
  difficultyGrade: 'pezoporia',
  participantsNum: 1,
}

const baseOfficialHiking = {
  ...basePersonalHiking,
  isOfficial: true as const,
  maxAltitude: 2918,
  totalElevationGain: 1200,
  startPoint: 'Λιτόχωρο',
  endPoint: 'Μύτικας',
}

// ── Helper ────────────────────────────────────────────────────────────────────

/** One membership → valid for official MVP flow. */
const oneMembership = [{ clubId: CLUB_ID }]

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ActivitiesService', () => {
  let service: ActivitiesService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ScoringService, useValue: mockScoringService },
      ],
    }).compile()

    service = module.get<ActivitiesService>(ActivitiesService)

    // Default happy-path mocks.
    mockUser.findUnique.mockResolvedValue({ id: CALLER_USER_ID })
    mockRoute.findUnique.mockResolvedValue(MOCK_ROUTE)
    mockClub.findUnique.mockResolvedValue(MOCK_CLUB)
    mockClubMembership.findMany.mockResolvedValue(oneMembership)
    mockActivity.create.mockResolvedValue({
      id: ACTIVITY_ID,
      isOfficial: false,
      points: null,
      climbingDetail: {},
    })
    mockCalculateClimbingPoints.mockResolvedValue(10)
    mockCalculateHikingPoints.mockReturnValue(8)
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section A — createClimbing difficulty validation
  // ════════════════════════════════════════════════════════════════════════════

  describe('createClimbing — difficulty validation', () => {
    // ── Personal: no difficulty ─────────────────────────────────────────────

    it('1. personal with no difficulty and no mixed → succeeds', async () => {
      await expect(service.createClimbing(basePersonal, CALLER_USER_ID)).resolves.not.toThrow()
      expect(mockActivity.create).toHaveBeenCalledTimes(1)
    })

    // ── Personal: valid regular difficulty ───────────────────────────────────

    it('2. personal with valid uiaa scale + valid UIAA grade → succeeds', async () => {
      const dto = { ...basePersonal, difficultyScale: 'uiaa', difficultyGrade: 'VI' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).resolves.not.toThrow()
    })

    it('7. personal with valid french scale + valid French grade → succeeds', async () => {
      const dto = { ...basePersonal, difficultyScale: 'french', difficultyGrade: '7a' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).resolves.not.toThrow()
    })

    it('personal with valid alpine scale + valid Alpine grade → succeeds', async () => {
      const dto = { ...basePersonal, difficultyScale: 'alpine', difficultyGrade: 'TD' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).resolves.not.toThrow()
    })

    it('personal with valid mixedClimbing → succeeds', async () => {
      const dto = { ...basePersonal, mixedClimbing: 'M4' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).resolves.not.toThrow()
    })

    // ── Personal: invalid regular difficulty ─────────────────────────────────

    it('3. personal with uiaa scale + arbitrary grade string → throws 422', async () => {
      const dto = { ...basePersonal, difficultyScale: 'uiaa', difficultyGrade: 'whatever' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    it('8. personal with french scale + arbitrary grade string → throws 422', async () => {
      const dto = { ...basePersonal, difficultyScale: 'french', difficultyGrade: 'whatever' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    it('personal with alpine scale + arbitrary grade string → throws 422', async () => {
      const dto = { ...basePersonal, difficultyScale: 'alpine', difficultyGrade: 'whatever' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    // ── Personal: mismatched scale/grade pairing ──────────────────────────────

    it('4. personal with difficultyGrade but no difficultyScale → throws 422', async () => {
      const dto = { ...basePersonal, difficultyGrade: 'VI' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    it('5. personal with difficultyScale but no difficultyGrade → throws 422', async () => {
      const dto = { ...basePersonal, difficultyScale: 'uiaa' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    // ── Personal: invalid mixedClimbing ──────────────────────────────────────

    it('6. personal with invalid mixedClimbing → throws 422', async () => {
      const dto = { ...basePersonal, mixedClimbing: 'X99' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    // ── Official: difficulty still required ──────────────────────────────────

    it('9. official with no difficulty and no mixed → throws 422', async () => {
      const { difficultyScale: _s, difficultyGrade: _g, ...nodifficulty } = baseOfficial
      await expect(service.createClimbing(nodifficulty, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    it('10. official with valid uiaa + valid grade → succeeds', async () => {
      await expect(service.createClimbing(baseOfficial, CALLER_USER_ID)).resolves.not.toThrow()
      expect(mockActivity.create).toHaveBeenCalledTimes(1)
    })

    // ── Route not found ───────────────────────────────────────────────────────

    it('throws NotFoundException when routeId does not exist', async () => {
      mockRoute.findUnique.mockResolvedValue(null)
      await expect(service.createClimbing(basePersonal, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })

    // ── French grade mapping — official records ──────────────────────────────

    describe('French grade mapping — official records', () => {
      const officialFrench = (sourceGrade: string) => ({
        ...baseOfficial,
        difficultyScale: 'french',
        difficultyGrade: sourceGrade,
      })

      it('F1. official French "6c" with mapping → succeeds; persists mappedScale=uiaa, mappedGrade=VII+', async () => {
        mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'VII+' })

        await expect(service.createClimbing(officialFrench('6c'), CALLER_USER_ID)).resolves.not.toThrow()
        expect(mockResolveClimbingGrade).toHaveBeenCalledWith('6c')

        const detail = mockActivity.create.mock.calls[0][0].data.climbingDetail.create
        expect(detail.difficultyScale).toBe('french')
        expect(detail.difficultyGrade).toBe('6c')
        expect(detail.mappedScale).toBe('uiaa')
        expect(detail.mappedGrade).toBe('VII+')
      })

      it('F2. official French "8b+" with mapping → persists mappedGrade=X+', async () => {
        mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'X+' })

        await expect(service.createClimbing(officialFrench('8b+'), CALLER_USER_ID)).resolves.not.toThrow()
        const detail = mockActivity.create.mock.calls[0][0].data.climbingDetail.create
        expect(detail.mappedGrade).toBe('X+')
      })

      it('F3. official French "5a+" with mapping → persists mappedGrade=V+', async () => {
        mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'V+' })

        await expect(service.createClimbing(officialFrench('5a+'), CALLER_USER_ID)).resolves.not.toThrow()
        const detail = mockActivity.create.mock.calls[0][0].data.climbingDetail.create
        expect(detail.mappedGrade).toBe('V+')
      })

      it('F4. official French grade with no mapping in DB → throws 422', async () => {
        mockResolveClimbingGrade.mockRejectedValue(
          new ScoringError('French climbing grade "9c" has no verified UIAA/Alpine mapping.'),
        )

        await expect(service.createClimbing(officialFrench('9c'), CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
        expect(mockActivity.create).not.toHaveBeenCalled()
      })

      it('F7. official French "6c" + WI4 succeeds; both difficulty fields persisted', async () => {
        mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'VII+' })

        const dto = { ...officialFrench('6c'), mixedClimbing: 'WI4' }
        await expect(service.createClimbing(dto, CALLER_USER_ID)).resolves.not.toThrow()

        const detail = mockActivity.create.mock.calls[0][0].data.climbingDetail.create
        expect(detail.difficultyScale).toBe('french')
        expect(detail.mixedClimbing).toBe('WI4')
        expect(detail.mappedGrade).toBe('VII+')
      })
    })

    // ── French grade — personal records (no DB lookup) ────────────────────────

    describe('French grade — personal records', () => {
      it('F5. personal French "7a" succeeds without resolveClimbingGrade being called', async () => {
        const dto = { ...basePersonal, difficultyScale: 'french', difficultyGrade: '7a' }
        await expect(service.createClimbing(dto, CALLER_USER_ID)).resolves.not.toThrow()
        expect(mockResolveClimbingGrade).not.toHaveBeenCalled()
      })

      it('F6. personal French grade "xyz" fails 422 without DB lookup', async () => {
        const dto = { ...basePersonal, difficultyScale: 'french', difficultyGrade: 'xyz' }
        await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow(UnprocessableEntityException)
        expect(mockResolveClimbingGrade).not.toHaveBeenCalled()
        expect(mockActivity.create).not.toHaveBeenCalled()
      })
    })

    // ── Official mixed-only ───────────────────────────────────────────────────

    it('official mixed-only (WI4) still works unchanged', async () => {
      const { difficultyScale: _s, difficultyGrade: _g, ...mixedOnly } = baseOfficial
      const dto = { ...mixedOnly, mixedClimbing: 'WI4' }
      await expect(service.createClimbing(dto, CALLER_USER_ID)).resolves.not.toThrow()
      expect(mockActivity.create).toHaveBeenCalledTimes(1)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section B — JWT ownership and clubId inference (Phase 11C)
  // ════════════════════════════════════════════════════════════════════════════

  describe('Phase 11C — JWT ownership and clubId inference (createClimbing)', () => {
    it('stores callerUserId as activity.userId, ignoring dto.userId', async () => {
      // dto has a userId field (backward compat) but it must be ignored.
      const dto = { ...basePersonal, userId: OTHER_USER_ID }
      await service.createClimbing(dto, CALLER_USER_ID)

      const createCall = mockActivity.create.mock.calls[0][0].data
      expect(createCall.userId).toBe(CALLER_USER_ID)
      expect(createCall.userId).not.toBe(OTHER_USER_ID)
    })

    it('official activity uses membership clubId, ignoring dto.clubId', async () => {
      const DIFFERENT_CLUB = 'different-club-uuid'
      // dto carries a legacy clubId that should NOT be used.
      const dto = { ...baseOfficial, clubId: DIFFERENT_CLUB }
      // Membership resolves to CLUB_ID (the real one).
      mockClubMembership.findMany.mockResolvedValue([{ clubId: CLUB_ID }])

      await service.createClimbing(dto, CALLER_USER_ID)

      const createCall = mockActivity.create.mock.calls[0][0].data
      expect(createCall.clubId).toBe(CLUB_ID)
      expect(createCall.clubId).not.toBe(DIFFERENT_CLUB)
    })

    it('official activity without membership → throws 422', async () => {
      mockClubMembership.findMany.mockResolvedValue([]) // no memberships
      await expect(service.createClimbing(baseOfficial, CALLER_USER_ID))
        .rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    it('official activity with multiple memberships → throws 422', async () => {
      mockClubMembership.findMany.mockResolvedValue([
        { clubId: 'club-a' },
        { clubId: 'club-b' },
      ])
      await expect(service.createClimbing(baseOfficial, CALLER_USER_ID))
        .rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    it('personal activity without membership → succeeds (no membership required)', async () => {
      mockClubMembership.findMany.mockResolvedValue([]) // no memberships, but personal is fine
      await expect(service.createClimbing(basePersonal, CALLER_USER_ID)).resolves.not.toThrow()
      expect(mockActivity.create).toHaveBeenCalledTimes(1)
    })

    it('personal activity stores clubId = null (not inferred from membership)', async () => {
      await service.createClimbing(basePersonal, CALLER_USER_ID)
      const createCall = mockActivity.create.mock.calls[0][0].data
      expect(createCall.clubId).toBeNull()
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section B2 — findAllForUser and findById (Phase 11C)
  // ════════════════════════════════════════════════════════════════════════════

  describe('Phase 11C — findAllForUser', () => {
    it('queries by callerUserId, ignores dto.userId', async () => {
      mockActivity.findMany.mockResolvedValue([])
      // dto has a userId (backward compat) that must be ignored.
      const dto = { userId: OTHER_USER_ID, category: undefined, take: 20, skip: 0 }
      await service.findAllForUser(dto, CALLER_USER_ID)

      const whereClause = mockActivity.findMany.mock.calls[0][0].where
      expect(whereClause.userId).toBe(CALLER_USER_ID)
      expect(whereClause.userId).not.toBe(OTHER_USER_ID)
    })

    it('includes category filter when provided', async () => {
      mockActivity.findMany.mockResolvedValue([])
      await service.findAllForUser({ category: 'hiking' }, CALLER_USER_ID)

      const whereClause = mockActivity.findMany.mock.calls[0][0].where
      expect(whereClause.category).toBe('hiking')
    })
  })

  describe('Phase 11C — findById', () => {
    const ownActivity = { id: ACTIVITY_ID, userId: CALLER_USER_ID, isOfficial: false }
    const otherActivity = { id: ACTIVITY_ID, userId: OTHER_USER_ID, isOfficial: false }

    it('returns activity when it belongs to callerUserId', async () => {
      mockActivity.findUnique.mockResolvedValue(ownActivity)
      const result = await service.findById(ACTIVITY_ID, CALLER_USER_ID)
      expect(result).toBe(ownActivity)
    })

    it('throws 404 when activity belongs to a different user', async () => {
      mockActivity.findUnique.mockResolvedValue(otherActivity)
      await expect(service.findById(ACTIVITY_ID, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })

    it('throws 404 when activity does not exist', async () => {
      mockActivity.findUnique.mockResolvedValue(null)
      await expect(service.findById(ACTIVITY_ID, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section C — createHiking auth behaviour (Phase 11C)
  // ════════════════════════════════════════════════════════════════════════════

  describe('Phase 11C — createHiking', () => {
    beforeEach(() => {
      mockActivity.create.mockResolvedValue({
        id: ACTIVITY_ID,
        isOfficial: false,
        points: null,
        hikingDetail: {},
      })
    })

    it('stores callerUserId as activity.userId', async () => {
      await service.createHiking(basePersonalHiking, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.userId).toBe(CALLER_USER_ID)
    })

    it('official hiking uses membership clubId', async () => {
      mockClubMembership.findMany.mockResolvedValue([{ clubId: CLUB_ID }])
      await service.createHiking(baseOfficialHiking, CALLER_USER_ID)

      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.clubId).toBe(CLUB_ID)
    })

    it('official hiking without membership → throws 422', async () => {
      mockClubMembership.findMany.mockResolvedValue([])
      await expect(service.createHiking(baseOfficialHiking, CALLER_USER_ID))
        .rejects.toThrow(UnprocessableEntityException)
    })

    it('personal hiking without membership → succeeds', async () => {
      mockClubMembership.findMany.mockResolvedValue([])
      await expect(service.createHiking(basePersonalHiking, CALLER_USER_ID)).resolves.not.toThrow()
    })

    it('personal hiking stores clubId = null', async () => {
      await service.createHiking(basePersonalHiking, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.clubId).toBeNull()
    })
  })
})
