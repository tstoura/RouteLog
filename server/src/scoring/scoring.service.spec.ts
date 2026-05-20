import { Test, TestingModule } from '@nestjs/testing'
import { ScoringService } from './scoring.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringError } from './scoring.errors'

/**
 * Unit tests for ScoringService.
 *
 * All expected values are pre-computed with plain JS arithmetic to verify that
 * the service formulas match docs/eooa-rules-alignment.md exactly.
 * Floating-point comparisons use toBeCloseTo(expected, 4) throughout.
 *
 * Test edge cases sourced from docs/eooa-rules-alignment.md §5.6.
 */

// Minimal PrismaService mock — only gradeMapping is used by the scoring service.
const mockGradeMapping = { findFirst: jest.fn() }
const mockPrismaService = { gradeMapping: mockGradeMapping }

describe('ScoringService', () => {
  let service: ScoringService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()
    service = module.get<ScoringService>(ScoringService)
  })

  // ── Hiking ─────────────────────────────────────────────────────────────────

  describe('calculateHikingPoints', () => {
    /** Baseline inputs that produce non-zero points for reuse/override in tests. */
    const base = {
      maxAltitude: 2000,
      totalElevationGain: 1000,
      distanceLength: 15,
      fieldType: 'ski_mountaineering',
      difficultyGrade: 'pezoporia',
      participantsNum: 4,
    }

    // §5.6: Hiking with participants_num < 3 and field_type = normal → points = 0
    it('returns 0 when field_type=normal and participants_num < 3', () => {
      expect(
        service.calculateHikingPoints({ ...base, fieldType: 'normal', participantsNum: 2 }),
      ).toBe(0)
    })

    // §5.6: winter_conditions coefficient = 1.5 < 1.7 → same zeroing rule
    it('returns 0 when field_type=winter_conditions and participants_num < 3', () => {
      expect(
        service.calculateHikingPoints({ ...base, fieldType: 'winter_conditions', participantsNum: 1 }),
      ).toBe(0)
    })

    // §5.6: ski_mountaineering coefficient = 1.8 >= 1.7 → points calculated even with 1 participant
    it('calculates points normally for ski_mountaineering regardless of participants_num', () => {
      // (2000/2000) * (1000/1000) * sqrt(max(15/15,1)) * 1.8 * 1 * sqrt(1) = 1.8
      expect(
        service.calculateHikingPoints({ ...base, participantsNum: 1 }),
      ).toBeCloseTo(1.8, 4)
    })

    // normal field but >= 3 participants → points calculated
    it('calculates points for field_type=normal when participants_num >= 3', () => {
      // (2000/2000) * (1000/1000) * 1 * 1.0 * 1 * sqrt(3) ≈ 1.7321
      expect(
        service.calculateHikingPoints({ ...base, fieldType: 'normal', participantsNum: 3 }),
      ).toBeCloseTo(1.7321, 4)
    })

    // §5.6: distance_length <= 15 → distanceFactor = 1
    it('uses distanceFactor = 1 when distance_length <= 15', () => {
      const result1 = service.calculateHikingPoints({ ...base, distanceLength: 15 })
      const result2 = service.calculateHikingPoints({ ...base, distanceLength: 7 })
      expect(result1).toBeCloseTo(result2, 10) // same result — distance factor is 1 for both
    })

    // §5.6: distance_length > 15 → distanceFactor = sqrt(distance_length / 15)
    it('applies sqrt(distance_length/15) when distance_length > 15', () => {
      // dist=60: factor = sqrt(60/15) = sqrt(4) = 2
      // with ski_mountaineering(1.8), AD(2.6), participants=4:
      // = (2000/2000)*(1000/1000)*2*1.8*2.6*sqrt(4) ≈ 18.72
      expect(
        service.calculateHikingPoints({ ...base, distanceLength: 60, difficultyGrade: 'AD', participantsNum: 4 }),
      ).toBeCloseTo(18.72, 4)
    })

    it('throws ScoringError for unknown field_type', () => {
      expect(() =>
        service.calculateHikingPoints({ ...base, fieldType: 'unknown' }),
      ).toThrow(ScoringError)
    })

    it('throws ScoringError for unknown difficulty_grade', () => {
      expect(() =>
        service.calculateHikingPoints({ ...base, difficultyGrade: 'Z+' }),
      ).toThrow(ScoringError)
    })
  })

  // ── Rock Climbing ──────────────────────────────────────────────────────────

  describe('calculateClimbingPoints', () => {
    /** Baseline: altitude>1000, summer, repeat, VI (UIAA coeff=10), routeLength=100, 2 participants. */
    const base = {
      altitude: 1200,
      routeLength: 100,
      season: 'summer',
      repetitionType: 'repeat',
      participantsNum: 2,
      difficultyScale: 'uiaa',
      difficultyGrade: 'VI',
      mappedGrade: null,
      mixedClimbing: null,
    }

    // §5.6: altitude <= 1000 → season coefficient NOT applied (winter = summer)
    it('does not apply season coefficient when altitude <= 1000', () => {
      const baseLow = { ...base, altitude: 800 }
      const winter = service.calculateClimbingPoints({ ...baseLow, season: 'winter' })
      const summer = service.calculateClimbingPoints({ ...baseLow, season: 'summer' })
      // Both should equal 1 * 1 * 1 * 10 * (100/1500) * 2 ≈ 1.3333
      expect(winter).toBeCloseTo(1.3333, 4)
      expect(summer).toBeCloseTo(1.3333, 4)
      expect(winter).toBeCloseTo(summer, 10) // identical
    })

    // season coefficient = 2 for winter when altitude > 1000
    it('doubles points for winter when altitude > 1000', () => {
      const summer = service.calculateClimbingPoints({ ...base, season: 'summer' })
      const winter = service.calculateClimbingPoints({ ...base, season: 'winter' })
      // summer: 1 * 1 * sqrt(1.2) * 10 * (100/1500) * 2 ≈ 1.4606
      expect(summer).toBeCloseTo(1.4606, 4)
      // winter: 2 * 1 * sqrt(1.2) * 10 * (100/1500) * 2 ≈ 2.9212
      expect(winter).toBeCloseTo(2.9212, 4)
      expect(winter).toBeCloseTo(summer * 2, 6)
    })

    // §5.6: only mixed_climbing → valid
    it('calculates correctly with only mixed_climbing (no regular difficulty)', () => {
      // finalDiff = max(0, M4=7) = 7
      // 1 * 1 * sqrt(1.2) * 7 * (200/1500) * 3 ≈ 3.0672
      expect(
        service.calculateClimbingPoints({
          ...base,
          difficultyScale: null,
          difficultyGrade: null,
          mixedClimbing: 'M4',
          routeLength: 200,
          participantsNum: 3,
        }),
      ).toBeCloseTo(3.0672, 4)
    })

    // §5.6: only regular difficulty → valid
    it('calculates correctly with only regular UIAA difficulty', () => {
      // 1 * 1 * sqrt(1.2) * 10 * (200/1500) * 3 ≈ 4.3818
      expect(
        service.calculateClimbingPoints({
          ...base,
          mixedClimbing: null,
          routeLength: 200,
          participantsNum: 3,
        }),
      ).toBeCloseTo(4.3818, 4)
    })

    // §5.6: both regular and mixed → finalDiff = max of both
    it('uses max of regular and mixed coefficients when both present', () => {
      // VI=10 vs M4=7 → max=10
      const withBoth = service.calculateClimbingPoints({
        ...base,
        mixedClimbing: 'M4',
        routeLength: 200,
        participantsNum: 3,
      })
      // same as only-regular case (VI=10 wins over M4=7)
      const withRegularOnly = service.calculateClimbingPoints({
        ...base,
        mixedClimbing: null,
        routeLength: 200,
        participantsNum: 3,
      })
      expect(withBoth).toBeCloseTo(withRegularOnly, 10)
    })

    it('uses mixed coefficient when it exceeds regular', () => {
      // IV=4 vs M12=15 → max=15
      const withMixedWins = service.calculateClimbingPoints({
        ...base,
        difficultyGrade: 'IV',
        mixedClimbing: 'M12',
        routeLength: 200,
        participantsNum: 3,
      })
      const withMixedOnly = service.calculateClimbingPoints({
        ...base,
        difficultyScale: null,
        difficultyGrade: null,
        mixedClimbing: 'M12',
        routeLength: 200,
        participantsNum: 3,
      })
      expect(withMixedWins).toBeCloseTo(withMixedOnly, 10)
    })

    // §5.6: route_length < 100 → routeLengthFactor uses 100
    it('uses route_length=100 as minimum in routeLengthFactor', () => {
      const shortRoute = service.calculateClimbingPoints({ ...base, routeLength: 60 })
      const exactMin  = service.calculateClimbingPoints({ ...base, routeLength: 100 })
      expect(shortRoute).toBeCloseTo(exactMin, 10) // identical: max(60,100)/1500 = max(100,100)/1500
      expect(shortRoute).toBeCloseTo(1.4606, 4)
    })

    it('uses actual route_length when >= 100', () => {
      // routeLength=200: factor = 200/1500
      // 1 * 1 * sqrt(1.2) * 10 * (200/1500) * 2 ≈ 2.9212
      expect(
        service.calculateClimbingPoints({ ...base, routeLength: 200 }),
      ).toBeCloseTo(2.9212, 4)
    })

    it('applies repetition coefficient of 3 for new route', () => {
      const repeat = service.calculateClimbingPoints({ ...base, repetitionType: 'repeat' })
      const newRoute = service.calculateClimbingPoints({ ...base, repetitionType: 'new' })
      expect(newRoute).toBeCloseTo(repeat * 3, 6)
      expect(newRoute).toBeCloseTo(4.3818, 4)
    })

    // §5.6: neither regular difficulty nor mixed_climbing → invalid
    it('throws ScoringError when neither regular difficulty nor mixed_climbing provided', () => {
      expect(() =>
        service.calculateClimbingPoints({
          ...base,
          difficultyScale: null,
          difficultyGrade: null,
          mixedClimbing: null,
        }),
      ).toThrow(ScoringError)
    })

    it('throws ScoringError for French grade without mappedGrade', () => {
      expect(() =>
        service.calculateClimbingPoints({
          ...base,
          difficultyScale: 'french',
          difficultyGrade: '6c',
          mappedGrade: null,
        }),
      ).toThrow(ScoringError)
    })

    it('scores correctly using mappedGrade when French scale is resolved', () => {
      // French 6c → UIAA VII+ (coeff=14), but we pass mappedGrade directly
      // 1 * 1 * sqrt(1.2) * 14 * (100/1500) * 2 ≈ 2.0448
      expect(
        service.calculateClimbingPoints({
          ...base,
          difficultyScale: 'french',
          difficultyGrade: '6c',
          mappedGrade: 'VII+',
        }),
      ).toBeCloseTo(2.0448, 4)
    })

    it('throws ScoringError for unknown season', () => {
      expect(() =>
        service.calculateClimbingPoints({ ...base, season: 'spring' }),
      ).toThrow(ScoringError)
    })

    it('throws ScoringError for unknown repetition_type', () => {
      expect(() =>
        service.calculateClimbingPoints({ ...base, repetitionType: 'solo' }),
      ).toThrow(ScoringError)
    })

    it('throws ScoringError for unknown UIAA grade', () => {
      expect(() =>
        service.calculateClimbingPoints({ ...base, difficultyGrade: 'XII' }),
      ).toThrow(ScoringError)
    })

    it('throws ScoringError for unknown mixed grade', () => {
      expect(() =>
        service.calculateClimbingPoints({
          ...base,
          difficultyScale: null,
          difficultyGrade: null,
          mixedClimbing: 'M99',
        }),
      ).toThrow(ScoringError)
    })
  })

  // ── Expeditions Abroad ─────────────────────────────────────────────────────

  describe('calculateExpeditionPoints', () => {
    /** Baseline: altitude=5000, TEG=1000, summer, AD(5.2), 2 participants, no org. */
    const base = {
      altitude: 5000,
      totalElevationGain: 1000,
      season: 'summer',
      difficultyGrade: 'AD',
      participantsNum: 2,
      organizationType: 'no',
    }

    // §5.6: organization_type = no → organization coefficient = 0 (added, not multiplied)
    it('adds organization coefficient of 0 when organization_type=no', () => {
      // 1 * sqrt(1000/5000) * (5000/2000)^2 * 5.2 * sqrt(2) + 0 ≈ 20.5548
      expect(service.calculateExpeditionPoints(base)).toBeCloseTo(20.5548, 4)
    })

    // §5.6: organization_type = other_continents → organization coefficient = 12
    it('adds organization coefficient of 12 for other_continents', () => {
      const noOrg = service.calculateExpeditionPoints(base)
      const withOrg = service.calculateExpeditionPoints({ ...base, organizationType: 'other_continents' })
      expect(withOrg - noOrg).toBeCloseTo(12, 8)
      expect(withOrg).toBeCloseTo(32.5548, 4)
    })

    it('correctly adds europe coefficient of 4', () => {
      const noOrg = service.calculateExpeditionPoints(base)
      const withOrg = service.calculateExpeditionPoints({ ...base, organizationType: 'europe' })
      expect(withOrg - noOrg).toBeCloseTo(4, 8)
    })

    it('correctly adds africa coefficient of 6', () => {
      const noOrg = service.calculateExpeditionPoints(base)
      const withOrg = service.calculateExpeditionPoints({ ...base, organizationType: 'africa' })
      expect(withOrg - noOrg).toBeCloseTo(6, 8)
    })

    it('applies season coefficient of 2 for winter', () => {
      const summer = service.calculateExpeditionPoints(base)
      const winter = service.calculateExpeditionPoints({ ...base, season: 'winter' })
      // Winter should be 2x the pre-org part; org (0) is the same
      expect(winter).toBeCloseTo(summer * 2, 6)
      expect(winter).toBeCloseTo(41.1096, 4)
    })

    // §5.6: no minimum participants restriction for expeditions
    it('accepts participantsNum = 1 without zeroing', () => {
      // 1 * sqrt(1000/5000) * (5000/2000)^2 * 5.2 * sqrt(1) + 0 ≈ 14.5344
      expect(
        service.calculateExpeditionPoints({ ...base, participantsNum: 1 }),
      ).toBeCloseTo(14.5344, 4)
    })

    it('uses pezoporia difficulty coefficient of 2', () => {
      // 1 * sqrt(1000/5000) * (5000/2000)^2 * 2 * sqrt(2) + 0
      const expected = 1 * Math.sqrt(1000 / 5000) * Math.pow(5000 / 2000, 2) * 2 * Math.sqrt(2)
      expect(
        service.calculateExpeditionPoints({ ...base, difficultyGrade: 'pezoporia' }),
      ).toBeCloseTo(expected, 4)
    })

    it('throws ScoringError for unknown expedition difficulty grade', () => {
      expect(() =>
        service.calculateExpeditionPoints({ ...base, difficultyGrade: 'pezoporia_typo' }),
      ).toThrow(ScoringError)
    })

    it('throws ScoringError for unknown organization_type', () => {
      expect(() =>
        service.calculateExpeditionPoints({ ...base, organizationType: 'asia' }),
      ).toThrow(ScoringError)
    })

    it('throws ScoringError for unknown season', () => {
      expect(() =>
        service.calculateExpeditionPoints({ ...base, season: 'spring' }),
      ).toThrow(ScoringError)
    })
  })

  // ── resolveClimbingGrade ───────────────────────────────────────────────────

  describe('resolveClimbingGrade', () => {
    it('returns mappedScale and mappedGrade when a verified mapping exists', async () => {
      mockGradeMapping.findFirst.mockResolvedValueOnce({
        sourceScale: 'french',
        sourceGrade: '6c',
        targetScale: 'uiaa',
        targetGrade: 'VII+',
      })
      const result = await service.resolveClimbingGrade('6c')
      expect(result).toEqual({ mappedScale: 'uiaa', mappedGrade: 'VII+' })
      expect(mockGradeMapping.findFirst).toHaveBeenCalledWith({
        where: { sourceScale: 'french', sourceGrade: '6c', targetScale: 'uiaa' },
      })
    })

    it('throws ScoringError when no verified mapping exists', async () => {
      mockGradeMapping.findFirst.mockResolvedValueOnce(null)
      await expect(service.resolveClimbingGrade('6c')).rejects.toThrow(ScoringError)
    })

    it('trims whitespace from the input grade before querying', async () => {
      mockGradeMapping.findFirst.mockResolvedValueOnce(null)
      await service.resolveClimbingGrade('  6c  ').catch(() => {})
      expect(mockGradeMapping.findFirst).toHaveBeenCalledWith({
        where: { sourceScale: 'french', sourceGrade: '6c', targetScale: 'uiaa' },
      })
    })
  })
})
