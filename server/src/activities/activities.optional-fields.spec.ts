import { Test, TestingModule } from '@nestjs/testing'
import { ActivitiesService } from './activities.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringService } from '../scoring/scoring.service'

/**
 * Regression tests for optional minimum scoring fields (EOOA alignment).
 *
 * Verifies that official activities submitted without the optional numeric fields
 * (distanceLength, altitude, routeLength) correctly apply EOOA minimum thresholds
 * in both scoring calls and DB persistence:
 *
 *   hiking distanceLength  omitted / ≤ 0     → service passes 15 km to scoring
 *   climbing altitude      omitted / < 1 m   → stored as 0; scoring uses 1000 m (EOOA floor)
 *   climbing routeLength   omitted / < 0.01  → service passes 100 m to scoring
 *
 * These floors match the max(...) expressions already present in the EOOA formulas:
 *   sqrt(max(distanceLength / 15, 1))
 *   sqrt(max(altitude / 1000, 1))
 *   max(routeLength, 100) / 1500
 *
 * Section J — createHiking  optional distanceLength
 * Section K — createClimbing optional altitude / routeLength
 * Section M — patchActivity  optional fields (hiking + climbing)
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const CALLER_USER_ID = '00000000-0000-0000-0000-000000000001'
const CLUB_ID        = 'club-uuid'
const ACTIVITY_ID    = 'activity-uuid'

// ── Prisma mock stubs ─────────────────────────────────────────────────────────

const MOCK_USER  = { id: CALLER_USER_ID }
const MOCK_ROUTE = { id: 'route-uuid', name: 'Test Route', mountainOrArea: 'Olympos', climbingField: 'Metropolis' }
const oneMembership = [{ clubId: CLUB_ID }]

const mockUser           = { findUnique: jest.fn() }
const mockRoute          = { findUnique: jest.fn() }
const mockClub           = { findUnique: jest.fn() }
const mockActivity       = { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() }
const mockClubMembership = { findMany: jest.fn() }

const mockPrismaService = {
  user:           mockUser,
  route:          mockRoute,
  club:           mockClub,
  clubMembership: mockClubMembership,
  activity:       mockActivity,
  gradeMapping:   { findFirst: jest.fn() },
}

// ── Scoring mock ──────────────────────────────────────────────────────────────

const mockCalculateHikingPoints   = jest.fn()
const mockCalculateClimbingPoints = jest.fn()
const mockResolveClimbingGrade    = jest.fn()
const mockCalculateExpeditionPoints = jest.fn()

const mockScoringService = {
  calculateHikingPoints:    mockCalculateHikingPoints,
  calculateClimbingPoints:  mockCalculateClimbingPoints,
  resolveClimbingGrade:     mockResolveClimbingGrade,
  calculateExpeditionPoints: mockCalculateExpeditionPoints,
}

// ── Base payloads ─────────────────────────────────────────────────────────────

/** Minimal valid official hiking payload (no distanceLength — the field under test). */
const baseOfficialHiking = {
  date:              '2026-06-01',
  isOfficial:        true as const,
  mountain:          'Ολυμπος',
  startPoint:        'Λιτόχωρο',
  endPoint:          'Μύτικας',
  maxAltitude:       2918,
  totalElevationGain: 1200,
  fieldType:         'normal',
  difficultyGrade:   'pezoporia',
  participantsNum:   3,
}

/** Minimal valid official climbing payload (no altitude / routeLength — fields under test). */
const baseOfficialClimbing = {
  routeId:        'route-uuid',
  date:           '2026-06-01',
  isOfficial:     true as const,
  season:         'summer',
  repetitionType: 'new',
  participantsNum: 1,
  difficultyScale: 'uiaa',
  difficultyGrade: 'VI',
}

// ── Existing activity stubs for patch tests ────────────────────────────────────

/** Official hiking stored with distanceLength=0 (floor sentinel). */
const existingHikingZeroDistance = {
  id:        ACTIVITY_ID,
  userId:    CALLER_USER_ID,
  clubId:    CLUB_ID,
  category:  'hiking',
  isOfficial: true,
  points:    5.0,
  date:      new Date('2026-01-15'),
  privateNotes: null,
  publicNotes:  null,
  hikingDetail: {
    mountain:           'Ολυμπος',
    startPoint:         'Λιτόχωρο',
    endPoint:           'Μύτικας',
    maxAltitude:        2918,
    totalElevationGain: 1200,
    distanceLength:     0,
    fieldType:          'normal',
    difficultyGrade:    'pezoporia',
    participantsNum:    3,
  },
  climbingDetail:   null,
  expeditionDetail: null,
}

/** Official climbing stored with altitude=0 and routeLength=0 (floor sentinels). */
const existingClimbingZeroFields = {
  id:        ACTIVITY_ID,
  userId:    CALLER_USER_ID,
  clubId:    CLUB_ID,
  category:  'climbing',
  isOfficial: true,
  points:    12.0,
  date:      new Date('2026-02-10'),
  privateNotes: null,
  publicNotes:  null,
  hikingDetail: null,
  climbingDetail: {
    routeId:         'route-uuid',
    routeName:       'Test Route',
    mountainOrArea:  'Olympus',
    climbingField:   'Metropolis',
    season:          'summer',
    repetitionType:  'repeat',
    altitude:        0,
    routeLength:     0,
    participantsNum: 1,
    participantsText: '',
    completionType:  null,
    difficultyScale: 'uiaa',
    difficultyGrade: 'VI',
    mappedScale:     null,
    mappedGrade:     null,
    mixedClimbing:   null,
  },
  expeditionDetail: null,
}

/** Official climbing stored with real altitude and routeLength values. */
const existingClimbingRealFields = {
  ...existingClimbingZeroFields,
  climbingDetail: {
    ...existingClimbingZeroFields.climbingDetail,
    altitude:    1500,
    routeLength: 200,
  },
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ActivitiesService — optional minimum scoring fields (Sections J, K, M)', () => {
  let service: ActivitiesService

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService,  useValue: mockPrismaService },
        { provide: ScoringService, useValue: mockScoringService },
      ],
    }).compile()

    service = module.get<ActivitiesService>(ActivitiesService)

    // Happy-path defaults
    mockUser.findUnique.mockResolvedValue(MOCK_USER)
    mockRoute.findUnique.mockResolvedValue(MOCK_ROUTE)
    mockClubMembership.findMany.mockResolvedValue(oneMembership)
    mockActivity.create.mockResolvedValue({
      id: ACTIVITY_ID, isOfficial: true, points: 5, hikingDetail: {}, climbingDetail: {},
    })
    mockActivity.update.mockResolvedValue({
      id: ACTIVITY_ID, isOfficial: true, points: 8, hikingDetail: {}, climbingDetail: {},
    })
    mockCalculateHikingPoints.mockReturnValue(8)
    mockCalculateClimbingPoints.mockReturnValue(10)
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section J — createHiking: optional distanceLength
  // ══════════════════════════════════════════════════════════════════════════

  describe('Section J — createHiking optional distanceLength', () => {
    it('J1. official hiking with distanceLength omitted → succeeds (does not throw)', async () => {
      await expect(
        service.createHiking({ ...baseOfficialHiking }, CALLER_USER_ID),
      ).resolves.not.toThrow()
    })

    it('J2. official hiking with distanceLength omitted → scoring called with 15 (EOOA floor)', async () => {
      await service.createHiking({ ...baseOfficialHiking }, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 15 }),
      )
    })

    it('J3. official hiking with distanceLength omitted → persisted with 15', async () => {
      await service.createHiking({ ...baseOfficialHiking }, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.hikingDetail.create.distanceLength).toBe(15)
    })

    it('J4. official hiking with distanceLength=0 → scoring called with 15 (EOOA floor)', async () => {
      await service.createHiking({ ...baseOfficialHiking, distanceLength: 0 }, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 15 }),
      )
    })

    it('J5. official hiking with distanceLength=15 (explicit) → scoring called with 15', async () => {
      await service.createHiking({ ...baseOfficialHiking, distanceLength: 15 }, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 15 }),
      )
    })

    it('J6. omitted distanceLength and explicit distanceLength=15 pass identical value to scoring', async () => {
      await service.createHiking({ ...baseOfficialHiking }, CALLER_USER_ID)
      await service.createHiking({ ...baseOfficialHiking, distanceLength: 15 }, CALLER_USER_ID)
      const arg0 = mockCalculateHikingPoints.mock.calls[0][0]
      const arg1 = mockCalculateHikingPoints.mock.calls[1][0]
      expect(arg0.distanceLength).toBe(arg1.distanceLength)
    })

    it('J7. official hiking with distanceLength=10 (explicit, below 15) → service passes 10 to scoring (formula floors internally)', async () => {
      // The service only replaces omitted/zero with 15; explicit below-threshold
      // values are passed as-is. The scoring formula max(d/15, 1) handles them.
      await service.createHiking({ ...baseOfficialHiking, distanceLength: 10 }, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 10 }),
      )
    })

    it('J8. official hiking with distanceLength=30 (above 15) → scoring called with actual value', async () => {
      await service.createHiking({ ...baseOfficialHiking, distanceLength: 30 }, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 30 }),
      )
    })

    it('J9. official hiking with participantsNum<3 still fails even when distanceLength is omitted', async () => {
      await expect(
        service.createHiking({ ...baseOfficialHiking, participantsNum: 2 }, CALLER_USER_ID),
      ).rejects.toThrow()
      expect(mockCalculateHikingPoints).not.toHaveBeenCalled()
    })

    it('J10. personal hiking with distanceLength omitted → stored as 0 sentinel, scoring not called', async () => {
      mockActivity.create.mockResolvedValueOnce({
        id: ACTIVITY_ID, isOfficial: false, points: null, hikingDetail: {},
      })
      await service.createHiking({ ...baseOfficialHiking, isOfficial: false }, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.hikingDetail.create.distanceLength).toBe(0)
      expect(mockCalculateHikingPoints).not.toHaveBeenCalled()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section K — createClimbing: optional altitude / routeLength
  // ══════════════════════════════════════════════════════════════════════════

  describe('Section K — createClimbing optional altitude / routeLength', () => {
    // ── altitude ──────────────────────────────────────────────────────────────

    it('K1. official climbing with altitude omitted → succeeds', async () => {
      await expect(
        service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID),
      ).resolves.not.toThrow()
    })

    it('K2. official climbing with altitude omitted → scoring called with 1000 (EOOA floor)', async () => {
      await service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1000 }),
      )
    })

    it('K3. official climbing with altitude omitted → persisted with 0 (not provided)', async () => {
      await service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.climbingDetail.create.altitude).toBe(0)
    })

    it('K4. official climbing with altitude=0 → scoring called with 1000 (EOOA floor)', async () => {
      await service.createClimbing({ ...baseOfficialClimbing, altitude: 0 }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1000 }),
      )
    })

    it('K5. official climbing with altitude=800 (explicit, below 1000) → service passes 800 to scoring (formula floors internally)', async () => {
      // sqrt(max(800/1000, 1)) = sqrt(1) in the formula — same output as 1000.
      await service.createClimbing({ ...baseOfficialClimbing, altitude: 800 }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 800 }),
      )
    })

    it('K6. official climbing with altitude=1500 (above 1000) → scoring called with actual value', async () => {
      await service.createClimbing({ ...baseOfficialClimbing, altitude: 1500 }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1500 }),
      )
    })

    // ── routeLength ───────────────────────────────────────────────────────────

    it('K7. official climbing with routeLength omitted → succeeds', async () => {
      await expect(
        service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID),
      ).resolves.not.toThrow()
    })

    it('K8. official climbing with routeLength omitted → scoring called with 100 (EOOA floor)', async () => {
      await service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ routeLength: 100 }),
      )
    })

    it('K9. official climbing with routeLength omitted → persisted with 0 (not provided)', async () => {
      await service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.climbingDetail.create.routeLength).toBe(0)
    })

    it('K10. official climbing with routeLength=0 → scoring called with 100 (EOOA floor)', async () => {
      await service.createClimbing({ ...baseOfficialClimbing, routeLength: 0 }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ routeLength: 100 }),
      )
    })

    it('K11. official climbing with routeLength=200 (above 100) → scoring called with actual value', async () => {
      await service.createClimbing({ ...baseOfficialClimbing, routeLength: 200 }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ routeLength: 200 }),
      )
    })

    // ── both omitted ─────────────────────────────────────────────────────────

    it('K12. official climbing with both altitude and routeLength omitted → scoring uses both floors', async () => {
      await service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1000, routeLength: 100 }),
      )
    })

    it('K13. official climbing with both altitude and routeLength omitted → both stored as 0', async () => {
      await service.createClimbing({ ...baseOfficialClimbing }, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.climbingDetail.create.altitude).toBe(0)
      expect(createData.climbingDetail.create.routeLength).toBe(0)
    })

    it('K14. official climbing with explicit altitude=1500 and routeLength=200 → actual values used throughout', async () => {
      await service.createClimbing(
        { ...baseOfficialClimbing, altitude: 1500, routeLength: 200 },
        CALLER_USER_ID,
      )
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1500, routeLength: 200 }),
      )
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.climbingDetail.create.altitude).toBe(1500)
      expect(createData.climbingDetail.create.routeLength).toBe(200)
    })

    // ── existing EOOA rules still enforced ───────────────────────────────────

    it('K15. official climbing without any difficulty still fails with 422', async () => {
      const dto = { ...baseOfficialClimbing, difficultyScale: undefined, difficultyGrade: undefined } as any
      await expect(service.createClimbing(dto, CALLER_USER_ID)).rejects.toThrow()
      expect(mockCalculateClimbingPoints).not.toHaveBeenCalled()
    })

    it('K16. personal climbing with altitude omitted → stored as 0 sentinel, scoring not called', async () => {
      const dto = { ...baseOfficialClimbing, isOfficial: false as const, difficultyScale: undefined, difficultyGrade: undefined } as any
      mockActivity.create.mockResolvedValueOnce({ id: ACTIVITY_ID, isOfficial: false, points: null, climbingDetail: {} })
      await service.createClimbing(dto, CALLER_USER_ID)
      const createData = mockActivity.create.mock.calls[0][0].data
      expect(createData.climbingDetail.create.altitude).toBe(0)
      expect(createData.climbingDetail.create.routeLength).toBe(0)
      expect(mockCalculateClimbingPoints).not.toHaveBeenCalled()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Section M — patchActivity: optional fields
  // ══════════════════════════════════════════════════════════════════════════

  describe('Section M — patchActivity optional fields', () => {

    // ── Hiking patch ──────────────────────────────────────────────────────────

    it('M1. PATCH official hiking — stored distanceLength=0 recalculates with 15 (EOOA floor)', async () => {
      mockActivity.findUnique.mockResolvedValue(existingHikingZeroDistance)
      await service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 15 }),
      )
    })

    it('M2. PATCH official hiking with explicit distanceLength=0 in patch → recalculates with 15', async () => {
      mockActivity.findUnique.mockResolvedValue({
        ...existingHikingZeroDistance,
        hikingDetail: { ...existingHikingZeroDistance.hikingDetail, distanceLength: 20 },
      })
      await service.patchActivity(ACTIVITY_ID, { distanceLength: 0 }, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 15 }),
      )
    })

    it('M3. PATCH official hiking with distanceLength=30 in patch → recalculates with actual value', async () => {
      mockActivity.findUnique.mockResolvedValue(existingHikingZeroDistance)
      await service.patchActivity(ACTIVITY_ID, { distanceLength: 30 }, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 30 }),
      )
    })

    it('M4. PATCH official hiking without distanceLength in patch → uses stored value unchanged', async () => {
      // When dto.distanceLength is omitted (undefined), the service reads d.distanceLength from DB.
      // Stored value is 20 (a valid > 0 value), so it is passed as-is.
      mockActivity.findUnique.mockResolvedValue({
        ...existingHikingZeroDistance,
        hikingDetail: { ...existingHikingZeroDistance.hikingDetail, distanceLength: 20 },
      })
      await service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)
      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ distanceLength: 20 }),
      )
    })

    // ── Climbing patch ────────────────────────────────────────────────────────

    it('M5. PATCH official climbing — stored altitude=0 recalculates with 1000 (EOOA floor)', async () => {
      mockActivity.findUnique.mockResolvedValue(existingClimbingZeroFields)
      await service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1000 }),
      )
    })

    it('M6. PATCH official climbing — stored routeLength=0 recalculates with 100 (EOOA floor)', async () => {
      mockActivity.findUnique.mockResolvedValue(existingClimbingZeroFields)
      await service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ routeLength: 100 }),
      )
    })

    it('M7. PATCH official climbing — stored altitude=0 and routeLength=0 → both floors applied together', async () => {
      mockActivity.findUnique.mockResolvedValue(existingClimbingZeroFields)
      await service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1000, routeLength: 100 }),
      )
    })

    it('M8. PATCH official climbing with altitude=1500 in patch → recalculates with actual value', async () => {
      mockActivity.findUnique.mockResolvedValue(existingClimbingZeroFields)
      await service.patchActivity(ACTIVITY_ID, { altitude: 1500 }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1500 }),
      )
    })

    it('M9. PATCH official climbing with routeLength=200 in patch → recalculates with actual value', async () => {
      mockActivity.findUnique.mockResolvedValue(existingClimbingZeroFields)
      await service.patchActivity(ACTIVITY_ID, { routeLength: 200 }, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ routeLength: 200 }),
      )
    })

    it('M10. PATCH official climbing without altitude/routeLength in patch → uses stored values (1500, 200)', async () => {
      mockActivity.findUnique.mockResolvedValue(existingClimbingRealFields)
      await service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)
      expect(mockCalculateClimbingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ altitude: 1500, routeLength: 200 }),
      )
    })

    // ── Immutability checks ───────────────────────────────────────────────────

    it('M11. PATCH cannot change climbing route (routeId is snapshot — not in PatchActivityDto)', async () => {
      mockActivity.findUnique.mockResolvedValue(existingClimbingZeroFields)
      // Sending routeId in patch payload should be silently ignored (not in the DTO fields
      // processed by applyClimbingPatch — snapshot fields are never overwritten).
      await expect(
        service.patchActivity(ACTIVITY_ID, { routeId: 'different-uuid' } as any, CALLER_USER_ID),
      ).resolves.not.toThrow()
      // The update call should NOT contain a routeId change on the climbingDetail
      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.climbingDetail?.update?.routeId).toBeUndefined()
    })

    it('M12. PATCH hiking official participantsNum<3 still fails even with optional distanceLength', async () => {
      mockActivity.findUnique.mockResolvedValue(existingHikingZeroDistance)
      await expect(
        service.patchActivity(ACTIVITY_ID, { participantsNum: 2 }, CALLER_USER_ID),
      ).rejects.toThrow()
      expect(mockCalculateHikingPoints).not.toHaveBeenCalled()
    })
  })
})
