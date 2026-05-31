import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { ActivitiesService } from './activities.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringService } from '../scoring/scoring.service'
import { ScoringError } from '../scoring/scoring.errors'

/**
 * Unit tests for ActivitiesService — patchActivity and deleteActivity.
 *
 * Section E — ownership + immutability:
 *   PATCH another user's activity → 404
 *   DELETE another user's activity → 404
 *   PATCH non-existent activity → 404
 *
 * Section F — hiking patch:
 *   official with participantsNum=2 → 422
 *   official with participantsNum=3 → succeeds, recalculates points
 *   personal with participantsNum=1 → succeeds, points remain null
 *   official with invalid difficulty → 422
 *   official with pezoporia → succeeds
 *
 * Section G — climbing patch:
 *   official update of altitude/routeLength/difficulty → succeeds, recalculates points
 *   official with invalid/unmapped French grade → 422
 *   official with neither regular nor mixed difficulty → 422
 *   personal with no difficulty fields → succeeds
 *
 * Section H — expedition patch:
 *   official update of organizationType/difficulty → succeeds, recalculates points
 *   official with missing difficultyGrade → 422
 *   personal with optional fields omitted → succeeds, points null
 *
 * Section I — deleteActivity:
 *   owner deletes own hiking activity → ok: true + transaction executes
 *   delete another user's activity → 404
 *   delete non-existent activity → 404
 */

// ── Constants ──────────────────────────────────────────────────────────────────

const CALLER_USER_ID = '00000000-0000-0000-0000-000000000001'
const OTHER_USER_ID  = '00000000-0000-0000-0000-000000000002'
const CLUB_ID        = 'club-uuid'
const ACTIVITY_ID    = 'activity-uuid'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockActivity              = { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() }
const mockHikingActivityDetails = { delete: jest.fn() }
const mockClimbingActivityDetails = { delete: jest.fn() }
const mockExpeditionActivityDetails = { delete: jest.fn() }
const mockClubMembership        = { findMany: jest.fn() }
const mockUser                  = { findUnique: jest.fn() }
const mockRoute                 = { findUnique: jest.fn() }

const mockPrismaService: any = {
  user:                     mockUser,
  route:                    mockRoute,
  clubMembership:           mockClubMembership,
  activity:                 mockActivity,
  hikingActivityDetails:    mockHikingActivityDetails,
  climbingActivityDetails:  mockClimbingActivityDetails,
  expeditionActivityDetails: mockExpeditionActivityDetails,
  $transaction:             jest.fn((fn: (tx: any) => any) => fn(mockPrismaService)),
}

const mockCalculateHikingPoints    = jest.fn()
const mockCalculateClimbingPoints  = jest.fn()
const mockCalculateExpeditionPoints = jest.fn()
const mockResolveClimbingGrade     = jest.fn()

const mockScoringService = {
  calculateHikingPoints:    mockCalculateHikingPoints,
  calculateClimbingPoints:  mockCalculateClimbingPoints,
  calculateExpeditionPoints: mockCalculateExpeditionPoints,
  resolveClimbingGrade:     mockResolveClimbingGrade,
}

// ── Existing activity stubs ────────────────────────────────────────────────────

const existingOfficialHiking = {
  id: ACTIVITY_ID,
  userId: CALLER_USER_ID,
  clubId: CLUB_ID,
  category: 'hiking',
  isOfficial: true,
  points: 5.5,
  date: new Date('2026-01-15'),
  privateNotes: null,
  publicNotes: null,
  hikingDetail: {
    mountain: 'Ολυμπος',
    startPoint: 'Λιτόχωρο',
    endPoint: 'Μύτικας',
    maxAltitude: 2918,
    totalElevationGain: 1200,
    distanceLength: 15,
    fieldType: 'normal',
    difficultyGrade: 'pezoporia',
    participantsNum: 3,
  },
  climbingDetail: null,
  expeditionDetail: null,
}

const existingPersonalHiking = {
  ...existingOfficialHiking,
  isOfficial: false,
  clubId: null,
  points: null,
  hikingDetail: { ...existingOfficialHiking.hikingDetail, participantsNum: 1 },
}

const existingOfficialClimbing = {
  id: ACTIVITY_ID,
  userId: CALLER_USER_ID,
  clubId: CLUB_ID,
  category: 'climbing',
  isOfficial: true,
  points: 12.0,
  date: new Date('2026-02-10'),
  privateNotes: null,
  publicNotes: null,
  hikingDetail: null,
  climbingDetail: {
    routeId: 'route-uuid',
    routeName: 'Test Route',
    mountainOrArea: 'Olympus',
    climbingField: 'Metropolis',
    season: 'summer',
    repetitionType: 'repeat',
    altitude: 1500,
    routeLength: 200,
    participantsNum: 1,
    participantsText: '',
    completionType: null,
    difficultyScale: 'uiaa',
    difficultyGrade: 'VI',
    mappedScale: null,
    mappedGrade: null,
    mixedClimbing: null,
  },
  expeditionDetail: null,
}

const existingPersonalClimbing = {
  ...existingOfficialClimbing,
  isOfficial: false,
  clubId: null,
  points: null,
  climbingDetail: {
    ...existingOfficialClimbing.climbingDetail,
    difficultyScale: null,
    difficultyGrade: null,
  },
}

const existingOfficialExpedition = {
  id: ACTIVITY_ID,
  userId: CALLER_USER_ID,
  clubId: CLUB_ID,
  category: 'expedition',
  isOfficial: true,
  points: 20.0,
  date: new Date('2026-03-01'),
  privateNotes: null,
  publicNotes: null,
  hikingDetail: null,
  climbingDetail: null,
  expeditionDetail: {
    country: 'Νεπάλ',
    mountainRange: 'Ιμαλάια',
    mountain: 'Έβερεστ',
    summit: 'Κορυφή',
    routeName: 'Νοτιοδυτική Ράχη',
    season: 'summer',
    altitude: 8849,
    totalElevationGain: 3500,
    difficultyGrade: 'pezoporia',
    participantsNum: 3,
    organizationType: 'no',
  },
}

const existingPersonalExpedition = {
  ...existingOfficialExpedition,
  isOfficial: false,
  clubId: null,
  points: null,
  expeditionDetail: {
    country: 'Νεπάλ',
    mountainRange: '',
    mountain: 'Έβερεστ',
    summit: '',
    routeName: '',
    season: 'summer',
    altitude: 0,
    totalElevationGain: 0,
    difficultyGrade: '',
    participantsNum: 1,
    organizationType: 'no',
  },
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('ActivitiesService — patchActivity and deleteActivity', () => {
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

    // Default: update returns the updated activity.
    mockActivity.update.mockResolvedValue({ id: ACTIVITY_ID, hikingDetail: {} })
    // $transaction already defined in mockPrismaService above.
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section E — Ownership and security
  // ════════════════════════════════════════════════════════════════════════════

  describe('Section E — ownership and security', () => {
    it('E1. PATCH another user\'s activity → 404', async () => {
      mockActivity.findUnique.mockResolvedValue({ ...existingOfficialHiking, userId: OTHER_USER_ID })
      await expect(service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
      expect(mockActivity.update).not.toHaveBeenCalled()
    })

    it('E2. PATCH non-existent activity → 404', async () => {
      mockActivity.findUnique.mockResolvedValue(null)
      await expect(service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })

    it('E3. DELETE another user\'s activity → 404', async () => {
      mockActivity.findUnique.mockResolvedValue({ id: ACTIVITY_ID, userId: OTHER_USER_ID, category: 'hiking' })
      await expect(service.deleteActivity(ACTIVITY_ID, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
      expect(mockHikingActivityDetails.delete).not.toHaveBeenCalled()
    })

    it('E4. DELETE non-existent activity → 404', async () => {
      mockActivity.findUnique.mockResolvedValue(null)
      await expect(service.deleteActivity(ACTIVITY_ID, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section F — Hiking patch
  // ════════════════════════════════════════════════════════════════════════════

  describe('Section F — hiking patch', () => {
    beforeEach(() => {
      mockActivity.update.mockResolvedValue({ id: ACTIVITY_ID, hikingDetail: {} })
    })

    it('F1. official hiking patch with participantsNum=2 → 422', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialHiking)
      await expect(
        service.patchActivity(ACTIVITY_ID, { participantsNum: 2 }, CALLER_USER_ID),
      ).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.update).not.toHaveBeenCalled()
    })

    it('F2. official hiking patch with participantsNum=3 → succeeds and recalculates points', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialHiking)
      mockCalculateHikingPoints.mockReturnValue(8.5)

      await expect(
        service.patchActivity(ACTIVITY_ID, { participantsNum: 3 }, CALLER_USER_ID),
      ).resolves.not.toThrow()

      expect(mockCalculateHikingPoints).toHaveBeenCalledTimes(1)
      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.points).toBeCloseTo(8.5, 2)
    })

    it('F3. personal hiking patch with participantsNum=1 → succeeds, points remain null', async () => {
      mockActivity.findUnique.mockResolvedValue(existingPersonalHiking)

      await expect(
        service.patchActivity(ACTIVITY_ID, { participantsNum: 1 }, CALLER_USER_ID),
      ).resolves.not.toThrow()

      expect(mockCalculateHikingPoints).not.toHaveBeenCalled()
      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.points).toBeNull()
    })

    it('F4. official hiking patch with invalid difficultyGrade → 422', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialHiking)
      await expect(
        service.patchActivity(ACTIVITY_ID, { difficultyGrade: 'invalid_grade' }, CALLER_USER_ID),
      ).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.update).not.toHaveBeenCalled()
    })

    it('F5. official hiking patch with difficultyGrade="pezoporia" → succeeds', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialHiking)
      mockCalculateHikingPoints.mockReturnValue(6.0)

      await expect(
        service.patchActivity(ACTIVITY_ID, { difficultyGrade: 'pezoporia', participantsNum: 3 }, CALLER_USER_ID),
      ).resolves.not.toThrow()

      expect(mockCalculateHikingPoints).toHaveBeenCalledWith(
        expect.objectContaining({ difficultyGrade: 'pezoporia' }),
      )
    })

    it('F6. hiking patch updates only the date field, keeps other fields unchanged', async () => {
      mockActivity.findUnique.mockResolvedValue(existingPersonalHiking)
      await service.patchActivity(ACTIVITY_ID, { date: '2026-06-01' }, CALLER_USER_ID)

      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.date).toEqual(new Date('2026-06-01'))
      // Detail keeps existing values.
      expect(updateData.hikingDetail.update.mountain).toBe('Ολυμπος')
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section G — Climbing patch
  // ════════════════════════════════════════════════════════════════════════════

  describe('Section G — climbing patch', () => {
    beforeEach(() => {
      mockActivity.update.mockResolvedValue({ id: ACTIVITY_ID, climbingDetail: {} })
    })

    it('G1. official climbing patch of altitude/routeLength/difficulty → succeeds and recalculates', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialClimbing)
      mockCalculateClimbingPoints.mockResolvedValue(15.0)

      await expect(
        service.patchActivity(ACTIVITY_ID, { altitude: 2000, routeLength: 300, difficultyGrade: 'VII' }, CALLER_USER_ID),
      ).resolves.not.toThrow()

      expect(mockCalculateClimbingPoints).toHaveBeenCalledTimes(1)
      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.points).toBeCloseTo(15.0, 2)
    })

    it('G2. official climbing patch with French grade that has no mapping → 422', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialClimbing)
      mockResolveClimbingGrade.mockRejectedValue(
        new ScoringError('French climbing grade "9c" has no verified UIAA/Alpine mapping.'),
      )

      await expect(
        service.patchActivity(ACTIVITY_ID, { difficultyScale: 'french', difficultyGrade: '9c' }, CALLER_USER_ID),
      ).rejects.toThrow(UnprocessableEntityException)
      expect(mockActivity.update).not.toHaveBeenCalled()
    })

    it('G3. official climbing patch clearing both difficulty fields → 422 (no difficulty at all)', async () => {
      // Patch sends scale+grade as undefined, and existing has no mixedClimbing.
      // This clears regular difficulty; mixed is also null → should fail.
      mockActivity.findUnique.mockResolvedValue({
        ...existingOfficialClimbing,
        climbingDetail: {
          ...existingOfficialClimbing.climbingDetail,
          difficultyScale: null,
          difficultyGrade: null,
          mixedClimbing: null,
        },
      })

      await expect(
        service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it('G4. personal climbing patch with no difficulty fields → succeeds (omitting difficulty is fine)', async () => {
      mockActivity.findUnique.mockResolvedValue(existingPersonalClimbing)

      await expect(
        service.patchActivity(ACTIVITY_ID, { date: '2026-07-01' }, CALLER_USER_ID),
      ).resolves.not.toThrow()

      expect(mockCalculateClimbingPoints).not.toHaveBeenCalled()
      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.points).toBeNull()
    })

    it('G5. climbing patch cannot change routeId — routeId is not in PatchActivityDto, so DTO strips it', async () => {
      // Simulate client sending routeId — because forbidNonWhitelisted is set at global
      // level, this is rejected before reaching the service. At service level the field
      // simply doesn't arrive. This test confirms the service never touches routeId.
      mockActivity.findUnique.mockResolvedValue(existingPersonalClimbing)
      await service.patchActivity(ACTIVITY_ID, { date: '2026-07-01' }, CALLER_USER_ID)

      const updateData = mockActivity.update.mock.calls[0][0].data
      // routeId is not included in climbingDetail.update (the snapshot is preserved).
      expect(updateData.climbingDetail.update).not.toHaveProperty('routeId')
      expect(updateData.climbingDetail.update).not.toHaveProperty('routeName')
      expect(updateData.climbingDetail.update).not.toHaveProperty('mountainOrArea')
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section H — Expedition patch
  // ════════════════════════════════════════════════════════════════════════════

  describe('Section H — expedition patch', () => {
    beforeEach(() => {
      mockActivity.update.mockResolvedValue({ id: ACTIVITY_ID, expeditionDetail: {} })
    })

    it('H1. official expedition patch of organizationType/difficulty → succeeds, recalculates points', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialExpedition)
      mockCalculateExpeditionPoints.mockReturnValue(25.0)

      await expect(
        service.patchActivity(
          ACTIVITY_ID,
          { organizationType: 'other_continents', difficultyGrade: 'AD' },
          CALLER_USER_ID,
        ),
      ).resolves.not.toThrow()

      expect(mockCalculateExpeditionPoints).toHaveBeenCalledWith(
        expect.objectContaining({ organizationType: 'other_continents', difficultyGrade: 'AD' }),
      )
      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.points).toBeCloseTo(25.0, 2)
    })

    it('H2. official expedition patch clearing difficultyGrade → 422', async () => {
      mockActivity.findUnique.mockResolvedValue({
        ...existingOfficialExpedition,
        expeditionDetail: { ...existingOfficialExpedition.expeditionDetail, difficultyGrade: '' },
      })

      await expect(
        service.patchActivity(ACTIVITY_ID, {}, CALLER_USER_ID),
      ).rejects.toThrow(UnprocessableEntityException)
    })

    it('H3. personal expedition patch with all optional fields omitted → succeeds, points null', async () => {
      mockActivity.findUnique.mockResolvedValue(existingPersonalExpedition)

      await expect(
        service.patchActivity(ACTIVITY_ID, { mountain: 'Καύκασος' }, CALLER_USER_ID),
      ).resolves.not.toThrow()

      expect(mockCalculateExpeditionPoints).not.toHaveBeenCalled()
      const updateData = mockActivity.update.mock.calls[0][0].data
      expect(updateData.points).toBeNull()
    })

    it('H4. official expedition patch does not change clubId — uses existing record\'s clubId', async () => {
      mockActivity.findUnique.mockResolvedValue(existingOfficialExpedition)
      mockCalculateExpeditionPoints.mockReturnValue(20.0)

      await service.patchActivity(ACTIVITY_ID, { participantsNum: 4 }, CALLER_USER_ID)

      // The update does NOT touch clubId — it remains as stored in the activity row.
      const updateArgs = mockActivity.update.mock.calls[0][0]
      expect(updateArgs.data).not.toHaveProperty('clubId')
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // Section I — deleteActivity
  // ════════════════════════════════════════════════════════════════════════════

  describe('Section I — deleteActivity', () => {
    it('I1. owner can delete own hiking activity → { ok: true } and transaction deletes detail + activity', async () => {
      mockActivity.findUnique.mockResolvedValue({ id: ACTIVITY_ID, userId: CALLER_USER_ID, category: 'hiking' })
      mockHikingActivityDetails.delete.mockResolvedValue({})
      mockActivity.delete.mockResolvedValue({})

      const result = await service.deleteActivity(ACTIVITY_ID, CALLER_USER_ID)

      expect(result).toEqual({ ok: true })
      expect(mockHikingActivityDetails.delete).toHaveBeenCalledWith({ where: { activityId: ACTIVITY_ID } })
      expect(mockActivity.delete).toHaveBeenCalledWith({ where: { id: ACTIVITY_ID } })
    })

    it('I2. owner can delete own climbing activity → detail deleted first', async () => {
      mockActivity.findUnique.mockResolvedValue({ id: ACTIVITY_ID, userId: CALLER_USER_ID, category: 'climbing' })
      mockClimbingActivityDetails.delete.mockResolvedValue({})
      mockActivity.delete.mockResolvedValue({})

      await service.deleteActivity(ACTIVITY_ID, CALLER_USER_ID)

      expect(mockClimbingActivityDetails.delete).toHaveBeenCalledWith({ where: { activityId: ACTIVITY_ID } })
      expect(mockActivity.delete).toHaveBeenCalledTimes(1)
    })

    it('I3. owner can delete own expedition activity → detail deleted first', async () => {
      mockActivity.findUnique.mockResolvedValue({ id: ACTIVITY_ID, userId: CALLER_USER_ID, category: 'expedition' })
      mockExpeditionActivityDetails.delete.mockResolvedValue({})
      mockActivity.delete.mockResolvedValue({})

      await service.deleteActivity(ACTIVITY_ID, CALLER_USER_ID)

      expect(mockExpeditionActivityDetails.delete).toHaveBeenCalledWith({ where: { activityId: ACTIVITY_ID } })
    })

    it('I4. delete another user\'s activity → 404, nothing deleted', async () => {
      mockActivity.findUnique.mockResolvedValue({ id: ACTIVITY_ID, userId: OTHER_USER_ID, category: 'hiking' })

      await expect(service.deleteActivity(ACTIVITY_ID, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
      expect(mockHikingActivityDetails.delete).not.toHaveBeenCalled()
      expect(mockActivity.delete).not.toHaveBeenCalled()
    })

    it('I5. delete non-existent activity → 404', async () => {
      mockActivity.findUnique.mockResolvedValue(null)
      await expect(service.deleteActivity(ACTIVITY_ID, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })

    it('I6. after delete, findById returns 404 (activity.findUnique returns null)', async () => {
      // Simulate the state after deletion: findUnique returns null.
      mockActivity.findUnique.mockResolvedValue(null)
      await expect(service.findById(ACTIVITY_ID, CALLER_USER_ID)).rejects.toThrow(NotFoundException)
    })
  })
})
