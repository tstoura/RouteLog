import { Test, TestingModule } from '@nestjs/testing'
import { UnprocessableEntityException, NotFoundException } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringService } from '../scoring/scoring.service'

/**
 * Unit tests for ActivitiesService — climbing difficulty validation.
 *
 * Covers the personal-record cases where difficulty is optional but, when
 * provided, must contain valid values from the backend allowed sets.
 *
 * Required cases (per product spec):
 *   1. personal climbing with no difficulty and no mixed → succeeds
 *   2. personal climbing with valid uiaa + valid grade   → succeeds
 *   3. personal climbing with uiaa + "whatever"          → fails 422
 *   4. personal climbing with difficultyGrade but no difficultyScale → fails 422
 *   5. personal climbing with difficultyScale but no difficultyGrade → fails 422
 *   6. personal climbing with invalid mixedClimbing      → fails 422
 *   7. personal climbing with valid french + valid grade → succeeds
 *   8. personal climbing with french + invalid grade     → fails 422
 *   9. official climbing behavior — at least one difficulty required → fails 422
 *  10. official climbing behavior — valid uiaa difficulty succeeds
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
})
