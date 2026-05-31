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
