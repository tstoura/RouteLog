import { Test, TestingModule } from '@nestjs/testing'
import { UnprocessableEntityException, NotFoundException } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringService } from '../scoring/scoring.service'
import { ScoringError } from '../scoring/scoring.errors'

/**
 * Unit tests for ActivitiesService — climbing difficulty validation.
 *
 * Covers personal-record difficulty validation cases and official French-grade
 * mapping/scoring cases.
 *
 * Personal difficulty cases (cases 1–10):
 *   1. personal with no difficulty and no mixed → succeeds
 *   2. personal with valid uiaa + valid grade   → succeeds
 *   3. personal with uiaa + "whatever"          → fails 422
 *   4. personal with difficultyGrade but no difficultyScale → fails 422
 *   5. personal with difficultyScale but no difficultyGrade → fails 422
 *   6. personal with invalid mixedClimbing      → fails 422
 *   7. personal with valid french + valid grade → succeeds (no DB lookup)
 *   8. personal with french + invalid grade     → fails 422
 *   9. official with no difficulty and no mixed → fails 422
 *  10. official with valid uiaa difficulty      → succeeds
 *
 * French mapping cases (cases F1–F7):
 *  F1. official French 6c with mapping → succeeds, persists mappedGrade = "VII+"
 *  F2. official French 8b+ with mapping → succeeds, persists mappedGrade = "X+"
 *  F3. official French 5a+ with mapping → succeeds, persists mappedGrade = "V+"
 *  F4. official French grade outside seeded mappings → fails 422
 *  F5. personal French 7a succeeds without DB lookup / scoring
 *  F6. invalid personal French grade still fails 422
 *  F7. official French 6c + WI4 uses max(regular, mixed) coefficient logic
 */

// ── Minimal mock stubs ────────────────────────────────────────────────────────

const MOCK_ROUTE = {
  id: 'route-uuid',
  name: 'Test Route',
  mountainOrArea: 'Olympus',
  climbingField: 'Metropolis',
}

const MOCK_CLUB = { id: 'club-uuid' }

const mockUser = { findUnique: jest.fn() }
const mockRoute = { findUnique: jest.fn() }   // prisma.route (canonical climbing routes)
const mockClub = { findUnique: jest.fn() }
const mockActivity = { create: jest.fn() }

const mockPrismaService = {
  user: mockUser,
  route: mockRoute,
  club: mockClub,
  activity: mockActivity,
}

const mockCalculateClimbingPoints = jest.fn()
const mockResolveClimbingGrade = jest.fn()

const mockScoringService = {
  calculateClimbingPoints: mockCalculateClimbingPoints,
  resolveClimbingGrade: mockResolveClimbingGrade,
}

// ── Base payloads ─────────────────────────────────────────────────────────────

/** Minimal personal climbing payload — only the three always-required fields. */
const basePersonal = {
  userId: '00000000-0000-0000-0000-000000000001',
  routeId: 'route-uuid',
  date: '2026-05-26',
  isOfficial: false as const,
  season: 'summer',
  repetitionType: 'new',
  participantsNum: 1,
}

/** Minimal official climbing payload with UIAA difficulty. */
const baseOfficial = {
  userId: '00000000-0000-0000-0000-000000000001',
  clubId: 'club-uuid',
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

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ActivitiesService — createClimbing difficulty validation', () => {
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

    // Default: user, route and club exist; activity create returns minimal object.
    mockUser.findUnique.mockResolvedValue({ id: '00000000-0000-0000-0000-000000000001' })
    mockRoute.findUnique.mockResolvedValue(MOCK_ROUTE)
    mockClub.findUnique.mockResolvedValue(MOCK_CLUB)
    mockActivity.create.mockResolvedValue({
      id: 'activity-uuid',
      isOfficial: false,
      points: null,
      climbingDetail: {},
    })
    mockCalculateClimbingPoints.mockResolvedValue(10)
  })

  // ── Personal: no difficulty ───────────────────────────────────────────────

  it('1. personal with no difficulty and no mixed → succeeds', async () => {
    await expect(service.createClimbing(basePersonal)).resolves.not.toThrow()
    expect(mockActivity.create).toHaveBeenCalledTimes(1)
  })

  // ── Personal: valid regular difficulty ────────────────────────────────────

  it('2. personal with valid uiaa scale + valid UIAA grade → succeeds', async () => {
    const dto = { ...basePersonal, difficultyScale: 'uiaa', difficultyGrade: 'VI' }
    await expect(service.createClimbing(dto)).resolves.not.toThrow()
    expect(mockActivity.create).toHaveBeenCalledTimes(1)
  })

  it('7. personal with valid french scale + valid French grade → succeeds', async () => {
    const dto = { ...basePersonal, difficultyScale: 'french', difficultyGrade: '7a' }
    await expect(service.createClimbing(dto)).resolves.not.toThrow()
    expect(mockActivity.create).toHaveBeenCalledTimes(1)
  })

  it('personal with valid alpine scale + valid Alpine grade → succeeds', async () => {
    const dto = { ...basePersonal, difficultyScale: 'alpine', difficultyGrade: 'TD' }
    await expect(service.createClimbing(dto)).resolves.not.toThrow()
    expect(mockActivity.create).toHaveBeenCalledTimes(1)
  })

  it('personal with valid mixedClimbing → succeeds', async () => {
    const dto = { ...basePersonal, mixedClimbing: 'M4' }
    await expect(service.createClimbing(dto)).resolves.not.toThrow()
    expect(mockActivity.create).toHaveBeenCalledTimes(1)
  })

  // ── Personal: invalid regular difficulty ──────────────────────────────────

  it('3. personal with uiaa scale + arbitrary grade string → throws 422', async () => {
    const dto = { ...basePersonal, difficultyScale: 'uiaa', difficultyGrade: 'whatever' }
    await expect(service.createClimbing(dto)).rejects.toThrow(UnprocessableEntityException)
    expect(mockActivity.create).not.toHaveBeenCalled()
  })

  it('8. personal with french scale + arbitrary grade string → throws 422', async () => {
    const dto = { ...basePersonal, difficultyScale: 'french', difficultyGrade: 'whatever' }
    await expect(service.createClimbing(dto)).rejects.toThrow(UnprocessableEntityException)
    expect(mockActivity.create).not.toHaveBeenCalled()
  })

  it('personal with alpine scale + arbitrary grade string → throws 422', async () => {
    const dto = { ...basePersonal, difficultyScale: 'alpine', difficultyGrade: 'whatever' }
    await expect(service.createClimbing(dto)).rejects.toThrow(UnprocessableEntityException)
    expect(mockActivity.create).not.toHaveBeenCalled()
  })

  // ── Personal: mismatched scale/grade pairing ──────────────────────────────

  it('4. personal with difficultyGrade but no difficultyScale → throws 422', async () => {
    const dto = { ...basePersonal, difficultyGrade: 'VI' }
    await expect(service.createClimbing(dto)).rejects.toThrow(UnprocessableEntityException)
    expect(mockActivity.create).not.toHaveBeenCalled()
  })

  it('5. personal with difficultyScale but no difficultyGrade → throws 422', async () => {
    const dto = { ...basePersonal, difficultyScale: 'uiaa' }
    await expect(service.createClimbing(dto)).rejects.toThrow(UnprocessableEntityException)
    expect(mockActivity.create).not.toHaveBeenCalled()
  })

  // ── Personal: invalid mixedClimbing ──────────────────────────────────────

  it('6. personal with invalid mixedClimbing → throws 422', async () => {
    const dto = { ...basePersonal, mixedClimbing: 'X99' }
    await expect(service.createClimbing(dto)).rejects.toThrow(UnprocessableEntityException)
    expect(mockActivity.create).not.toHaveBeenCalled()
  })

  // ── Official: difficulty still required ──────────────────────────────────

  it('9. official with no difficulty and no mixed → throws 422', async () => {
    const { difficultyScale: _s, difficultyGrade: _g, ...nodifficulty } = baseOfficial
    await expect(service.createClimbing(nodifficulty)).rejects.toThrow(UnprocessableEntityException)
    expect(mockActivity.create).not.toHaveBeenCalled()
  })

  it('10. official with valid uiaa + valid grade → succeeds', async () => {
    await expect(service.createClimbing(baseOfficial)).resolves.not.toThrow()
    expect(mockActivity.create).toHaveBeenCalledTimes(1)
  })

  // ── Route not found ───────────────────────────────────────────────────────

  it('throws NotFoundException when routeId does not exist', async () => {
    mockRoute.findUnique.mockResolvedValue(null)
    await expect(service.createClimbing(basePersonal)).rejects.toThrow(NotFoundException)
  })

  // ── French grade mapping (official records) ───────────────────────────────

  describe('French grade mapping — official records', () => {
    /** Official payload that uses French scale. */
    const officialFrench = (sourceGrade: string) => ({
      ...baseOfficial,
      difficultyScale: 'french',
      difficultyGrade: sourceGrade,
    })

    it('F1. official French "6c" with mapping → succeeds; persists mappedScale=uiaa, mappedGrade=VII+', async () => {
      mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'VII+' })

      await expect(service.createClimbing(officialFrench('6c'))).resolves.not.toThrow()
      expect(mockResolveClimbingGrade).toHaveBeenCalledWith('6c')

      const createCall = mockActivity.create.mock.calls[0][0]
      const detail = createCall.data.climbingDetail.create
      expect(detail.difficultyScale).toBe('french')
      expect(detail.difficultyGrade).toBe('6c')
      expect(detail.mappedScale).toBe('uiaa')
      expect(detail.mappedGrade).toBe('VII+')
    })

    it('F2. official French "8b+" with mapping → persists mappedGrade=X+', async () => {
      mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'X+' })

      await expect(service.createClimbing(officialFrench('8b+'))).resolves.not.toThrow()
      const detail = mockActivity.create.mock.calls[0][0].data.climbingDetail.create
      expect(detail.mappedGrade).toBe('X+')
    })

    it('F3. official French "5a+" with mapping → persists mappedGrade=V+', async () => {
      mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'V+' })

      await expect(service.createClimbing(officialFrench('5a+'))).resolves.not.toThrow()
      const detail = mockActivity.create.mock.calls[0][0].data.climbingDetail.create
      expect(detail.mappedGrade).toBe('V+')
    })

    it('F4. official French grade with no mapping in DB → throws 422', async () => {
      mockResolveClimbingGrade.mockRejectedValue(
        new ScoringError('French climbing grade "9c" has no verified UIAA/Alpine mapping.'),
      )

      await expect(service.createClimbing(officialFrench('9c'))).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.create).not.toHaveBeenCalled()
    })

    it('F7. official French "6c" + WI4 succeeds; max(regular=14, mixed=7) = 14 used', async () => {
      mockResolveClimbingGrade.mockResolvedValue({ mappedScale: 'uiaa', mappedGrade: 'VII+' })

      const dto = { ...officialFrench('6c'), mixedClimbing: 'WI4' }
      await expect(service.createClimbing(dto)).resolves.not.toThrow()

      expect(mockResolveClimbingGrade).toHaveBeenCalledWith('6c')
      // Both difficulty fields are persisted.
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
      await expect(service.createClimbing(dto)).resolves.not.toThrow()
      expect(mockResolveClimbingGrade).not.toHaveBeenCalled()
      expect(mockActivity.create).toHaveBeenCalledTimes(1)
    })

    it('F6. personal French grade "xyz" fails 422 without DB lookup', async () => {
      const dto = { ...basePersonal, difficultyScale: 'french', difficultyGrade: 'xyz' }
      await expect(service.createClimbing(dto)).rejects.toThrow(UnprocessableEntityException)
      expect(mockResolveClimbingGrade).not.toHaveBeenCalled()
      expect(mockActivity.create).not.toHaveBeenCalled()
    })
  })

  // ── Official mixed-only (unchanged behavior) ──────────────────────────────

  it('official mixed-only (WI4) still works unchanged', async () => {
    const { difficultyScale: _s, difficultyGrade: _g, ...mixedOnly } = baseOfficial
    const dto = { ...mixedOnly, mixedClimbing: 'WI4' }
    await expect(service.createClimbing(dto)).resolves.not.toThrow()
    expect(mockActivity.create).toHaveBeenCalledTimes(1)
  })
})
