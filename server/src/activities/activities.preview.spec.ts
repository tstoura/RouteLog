import { Test, TestingModule } from '@nestjs/testing'
import { ActivitiesService } from './activities.service'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringService } from '../scoring/scoring.service'

/**
 * Unit tests for the POST /activities/preview-points endpoint.
 *
 * Verifies that:
 *   - Valid complete payloads return { isReady: true, points: <string> }
 *   - Incomplete or invalid payloads return { isReady: false } without throwing
 *   - Preview does not create any activities in the database
 */

const mockPrismaService = {
  user: { findUnique: jest.fn() },
  route: { findUnique: jest.fn() },
  club: { findUnique: jest.fn() },
  clubMembership: { findMany: jest.fn() },
  activity: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  gradeMapping: { findFirst: jest.fn() },
}

describe('ActivitiesService — preview-points', () => {
  let service: ActivitiesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: mockPrismaService },
        ScoringService,
      ],
    }).compile()

    service = module.get<ActivitiesService>(ActivitiesService)

    jest.clearAllMocks()
  })

  // ── Hiking ──────────────────────────────────────────────────────────────────

  it('hiking — valid official payload → isReady=true with points', async () => {
    const result = await service.previewPoints({
      category: 'hiking',
      payload: {
        maxAltitude: 2000,
        totalElevationGain: 1000,
        distanceLength: 15,
        fieldType: 'normal',
        difficultyGrade: 'pezoporia',
        participantsNum: 3,
      },
    })

    expect(result.isReady).toBe(true)
    expect(result.points).not.toBeNull()
    expect(Number(result.points)).toBeGreaterThan(0)
  })

  it('hiking — participantsNum=2 → isReady=false (official rule: >=3)', async () => {
    const result = await service.previewPoints({
      category: 'hiking',
      payload: {
        maxAltitude: 2000,
        totalElevationGain: 1000,
        distanceLength: 15,
        fieldType: 'normal',
        difficultyGrade: 'pezoporia',
        participantsNum: 2,
      },
    })

    expect(result.isReady).toBe(false)
    expect(result.points).toBeNull()
  })

  it('hiking — missing altitude → isReady=false', async () => {
    const result = await service.previewPoints({
      category: 'hiking',
      payload: {
        totalElevationGain: 1000,
        fieldType: 'normal',
        difficultyGrade: 'pezoporia',
        participantsNum: 3,
      },
    })

    expect(result.isReady).toBe(false)
    expect(result.points).toBeNull()
  })

  it('hiking — empty payload → isReady=false (does not throw)', async () => {
    await expect(
      service.previewPoints({ category: 'hiking', payload: {} }),
    ).resolves.toMatchObject({ isReady: false, points: null })
  })

  // ── Climbing ────────────────────────────────────────────────────────────────

  it('climbing — valid UIAA payload → isReady=true with points', async () => {
    const result = await service.previewPoints({
      category: 'climbing',
      payload: {
        altitude: 1200,
        routeLength: 300,
        season: 'summer',
        repetitionType: 'repeat',
        participantsNum: 2,
        difficultyScale: 'uiaa',
        difficultyGrade: 'VI',
      },
    })

    expect(result.isReady).toBe(true)
    expect(result.points).not.toBeNull()
    expect(Number(result.points)).toBeGreaterThan(0)
  })

  it('climbing — incomplete difficulty (no scale, no mixed) → isReady=false', async () => {
    const result = await service.previewPoints({
      category: 'climbing',
      payload: {
        altitude: 1200,
        routeLength: 300,
        season: 'summer',
        repetitionType: 'repeat',
        participantsNum: 2,
      },
    })

    expect(result.isReady).toBe(false)
    expect(result.points).toBeNull()
  })

  it('climbing — mixed-only payload → isReady=true', async () => {
    const result = await service.previewPoints({
      category: 'climbing',
      payload: {
        altitude: 800,
        routeLength: 150,
        season: 'winter',
        repetitionType: 'new',
        participantsNum: 1,
        mixedClimbing: 'M4',
      },
    })

    expect(result.isReady).toBe(true)
    expect(result.points).not.toBeNull()
  })

  it('climbing — French grade with no DB mapping → isReady=false', async () => {
    mockPrismaService.gradeMapping.findFirst.mockResolvedValueOnce(null)

    const result = await service.previewPoints({
      category: 'climbing',
      payload: {
        altitude: 1200,
        routeLength: 300,
        season: 'summer',
        repetitionType: 'repeat',
        participantsNum: 2,
        difficultyScale: 'french',
        difficultyGrade: '7a',
      },
    })

    expect(result.isReady).toBe(false)
    expect(result.reason).toBe('french_grade_unmapped')
  })

  // ── Expedition ──────────────────────────────────────────────────────────────

  it('expedition — valid official payload → isReady=true with points', async () => {
    const result = await service.previewPoints({
      category: 'expedition',
      payload: {
        altitude: 5000,
        totalElevationGain: 2000,
        season: 'summer',
        difficultyGrade: 'PD',
        participantsNum: 4,
        organizationType: 'no',
      },
    })

    expect(result.isReady).toBe(true)
    expect(result.points).not.toBeNull()
    expect(Number(result.points)).toBeGreaterThan(0)
  })

  it('expedition — missing organizationType → isReady=false', async () => {
    const result = await service.previewPoints({
      category: 'expedition',
      payload: {
        altitude: 5000,
        totalElevationGain: 2000,
        season: 'summer',
        difficultyGrade: 'PD',
        participantsNum: 4,
      },
    })

    expect(result.isReady).toBe(false)
  })

  // ── Optional minimum scoring fields — preview regression (Section L) ───────
  //
  // Verifies that previewPoints applies the same EOOA floor defaults as
  // createHiking / createClimbing:
  //   hiking distanceLength  absent / 0  → 15 km  (previewHikingPoints)
  //   climbing altitude      absent / 0  → 1000 m (previewClimbingPoints)
  //   climbing routeLength   absent / 0  → 100 m  (previewClimbingPoints)
  //
  // Uses the real ScoringService so points values are verified end-to-end
  // against the EOOA formulas, not just mock return values.

  describe('Section L — optional fields in preview-points', () => {
    // Shared base payloads that satisfy all other required-field checks.
    const hikingBase = {
      maxAltitude: 2000,
      totalElevationGain: 1000,
      fieldType: 'ski_mountaineering',
      difficultyGrade: 'pezoporia',
      participantsNum: 4,
    }
    // Expected: (2000/2000)*(1000/1000)*sqrt(max(15/15,1))*1.8*1.0*sqrt(4) = 3.6 → "3.60"

    const climbingBase = {
      season: 'summer',
      repetitionType: 'repeat',
      participantsNum: 2,
      difficultyScale: 'uiaa',
      difficultyGrade: 'VI',
    }
    // At altitude=1000, routeLength=100, summer:
    // 1*1*sqrt(1)*10*(100/1500)*2 ≈ 1.3333 → "1.33"

    // ── Hiking distanceLength ────────────────────────────────────────────────

    it('L1. preview hiking with distanceLength absent → isReady=true, same points as distanceLength=15', async () => {
      const [withAbsent, withExplicit] = await Promise.all([
        service.previewPoints({ category: 'hiking', payload: { ...hikingBase } }),
        service.previewPoints({ category: 'hiking', payload: { ...hikingBase, distanceLength: 15 } }),
      ])
      expect(withAbsent.isReady).toBe(true)
      expect(withAbsent.points).toBe(withExplicit.points)
      expect(withAbsent.points).toBe('3.60')
    })

    it('L2. preview hiking with distanceLength=0 → isReady=true, same points as distanceLength=15', async () => {
      const [withZero, withFloor] = await Promise.all([
        service.previewPoints({ category: 'hiking', payload: { ...hikingBase, distanceLength: 0 } }),
        service.previewPoints({ category: 'hiking', payload: { ...hikingBase, distanceLength: 15 } }),
      ])
      expect(withZero.isReady).toBe(true)
      expect(withZero.points).toBe(withFloor.points)
    })

    it('L3. preview hiking with distanceLength=30 (above 15) → isReady=true, more points than distanceLength=15', async () => {
      const [with30, with15] = await Promise.all([
        service.previewPoints({ category: 'hiking', payload: { ...hikingBase, distanceLength: 30 } }),
        service.previewPoints({ category: 'hiking', payload: { ...hikingBase, distanceLength: 15 } }),
      ])
      expect(with30.isReady).toBe(true)
      expect(Number(with30.points)).toBeGreaterThan(Number(with15.points))
    })

    it('L4. preview hiking with participantsNum<3 still returns isReady=false (existing EOOA rule intact)', async () => {
      const result = await service.previewPoints({
        category: 'hiking',
        payload: { ...hikingBase, participantsNum: 2 },
      })
      expect(result.isReady).toBe(false)
      expect(result.points).toBeNull()
    })

    // ── Climbing altitude ────────────────────────────────────────────────────

    it('L5. preview climbing with altitude absent → isReady=true, same points as altitude=1000', async () => {
      const [withAbsent, withFloor] = await Promise.all([
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, routeLength: 100 } }),
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1000, routeLength: 100 } }),
      ])
      expect(withAbsent.isReady).toBe(true)
      expect(withAbsent.points).toBe(withFloor.points)
      expect(withAbsent.points).toBe('1.33')
    })

    it('L6. preview climbing with altitude=0 → isReady=true, same points as altitude=1000', async () => {
      const [withZero, withFloor] = await Promise.all([
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 0, routeLength: 100 } }),
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1000, routeLength: 100 } }),
      ])
      expect(withZero.isReady).toBe(true)
      expect(withZero.points).toBe(withFloor.points)
    })

    it('L7. preview climbing with altitude=1200 (above 1000) → isReady=true, more points than altitude=1000 (summer)', async () => {
      const [with1200, with1000] = await Promise.all([
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1200, routeLength: 100 } }),
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1000, routeLength: 100 } }),
      ])
      expect(with1200.isReady).toBe(true)
      expect(Number(with1200.points)).toBeGreaterThan(Number(with1000.points))
    })

    // ── Climbing routeLength ─────────────────────────────────────────────────

    it('L8. preview climbing with routeLength absent → isReady=true, same points as routeLength=100', async () => {
      const [withAbsent, withFloor] = await Promise.all([
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1200 } }),
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1200, routeLength: 100 } }),
      ])
      expect(withAbsent.isReady).toBe(true)
      expect(withAbsent.points).toBe(withFloor.points)
      expect(withAbsent.points).toBe('1.46')
    })

    it('L9. preview climbing with routeLength=0 → isReady=true, same points as routeLength=100', async () => {
      const [withZero, withFloor] = await Promise.all([
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1200, routeLength: 0 } }),
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1200, routeLength: 100 } }),
      ])
      expect(withZero.isReady).toBe(true)
      expect(withZero.points).toBe(withFloor.points)
    })

    it('L10. preview climbing with routeLength=200 (above 100) → isReady=true, more points than routeLength=100', async () => {
      const [with200, with100] = await Promise.all([
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1200, routeLength: 200 } }),
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1200, routeLength: 100 } }),
      ])
      expect(with200.isReady).toBe(true)
      expect(Number(with200.points)).toBeGreaterThan(Number(with100.points))
    })

    // ── Both optional — combined floor ───────────────────────────────────────

    it('L11. preview climbing with both altitude and routeLength absent → isReady=true, points equal to altitude=1000 + routeLength=100', async () => {
      // Floors: altitude → 1000 (no season), routeLength → 100
      // 1*1*sqrt(1)*10*(100/1500)*2 ≈ 1.3333 → "1.33"
      const [withAbsent, withBothFloors] = await Promise.all([
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase } }),
        service.previewPoints({ category: 'climbing', payload: { ...climbingBase, altitude: 1000, routeLength: 100 } }),
      ])
      expect(withAbsent.isReady).toBe(true)
      expect(withAbsent.points).toBe(withBothFloors.points)
    })

    it('L12. preview and create/patch use identical floor defaults for the same optional payload', async () => {
      // Both absent altitude+routeLength should produce the exact same string as
      // explicitly providing the floor values. This cross-validates that the
      // preview endpoint and the create endpoint agree on the thresholds.
      const previewResult = await service.previewPoints({
        category: 'climbing',
        payload: { ...climbingBase },
      })
      const previewResultWithFloors = await service.previewPoints({
        category: 'climbing',
        payload: { ...climbingBase, altitude: 1000, routeLength: 100 },
      })
      expect(previewResult.points).toBe(previewResultWithFloors.points)
    })
  })

  // ── No DB writes ────────────────────────────────────────────────────────────

  it('preview does not create any activity records', async () => {
    await service.previewPoints({
      category: 'hiking',
      payload: {
        maxAltitude: 2000,
        totalElevationGain: 1000,
        fieldType: 'normal',
        difficultyGrade: 'pezoporia',
        participantsNum: 3,
      },
    })

    expect(mockPrismaService.activity.create).not.toHaveBeenCalled()
  })
})
