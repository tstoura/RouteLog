import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { ScoringService } from '../scoring/scoring.service'
import { ScoringError } from '../scoring/scoring.errors'
import {
  HIKING_DIFFICULTY_GRADES,
  HIKING_FIELD_TYPES,
  HikingDifficultyGrade,
  HikingFieldType,
} from '../scoring/constants/hiking.constants'
import {
  CLIMBING_COMPLETION_TYPES,
  CLIMBING_DIFFICULTY_SCALES,
  CLIMBING_MIXED_GRADES,
  CLIMBING_REPETITION_TYPES,
  CLIMBING_SEASONS,
  CLIMBING_UIAA_GRADES,
  ClimbingCompletionType,
  ClimbingDifficultyScale,
  ClimbingMixedGrade,
  ClimbingRepetitionType,
  ClimbingSeason,
  ClimbingUiaaGrade,
} from '../scoring/constants/climbing.constants'
import {
  EXPEDITION_DIFFICULTY_GRADES,
  EXPEDITION_ORGANIZATION_TYPES,
  EXPEDITION_SEASONS,
  ExpeditionDifficultyGrade,
  ExpeditionOrganizationType,
  ExpeditionSeason,
} from '../scoring/constants/expedition.constants'
import { CreateHikingActivityDto } from './dto/create-hiking-activity.dto'
import { CreateClimbingActivityDto } from './dto/create-climbing-activity.dto'
import { CreateExpeditionActivityDto } from './dto/create-expedition-activity.dto'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  /**
   * Creates a Hiking / Ski Mountaineering activity.
   *
   * Creates both `activities` and `hiking_activity_details` in a single Prisma
   * nested write (treated as an implicit transaction).
   *
   * Official activities (is_official = true):
   *   - club_id is required and must resolve to an existing club.
   *   - field_type must be one of the EOOA-recognised values.
   *   - difficulty_grade must be one of the EOOA-recognised hiking grades.
   *   - max_altitude and total_elevation_gain must be > 0.
   *   - Points are calculated via ScoringService and rounded to 2 d.p.
   *
   * Personal activities (is_official = false):
   *   - club_id is optional.
   *   - field_type and difficulty_grade can be any non-empty string.
   *   - Numeric ranges are more relaxed (see DTO).
   *   - Points remain null.
   */
  async createHiking(dto: CreateHikingActivityDto) {
    // ── Validate user exists ─────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } })
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`)
    }

    // ── Official-activity business rules ────────────────────────────────────
    let points: number | null = null

    if (dto.isOfficial) {
      // club_id is required — DTO validates it's a UUID; service checks existence.
      const club = await this.prisma.club.findUnique({ where: { id: dto.clubId! } })
      if (!club) {
        throw new NotFoundException(`Club with id ${dto.clubId} not found`)
      }

      // field_type must match EOOA-allowed values.
      if (!HIKING_FIELD_TYPES.includes(dto.fieldType as HikingFieldType)) {
        throw new UnprocessableEntityException(
          `field_type "${dto.fieldType}" is not valid for official activities. ` +
          `Allowed values: ${HIKING_FIELD_TYPES.join(', ')}.`,
        )
      }

      // difficulty_grade must match EOOA-allowed values.
      if (!HIKING_DIFFICULTY_GRADES.includes(dto.difficultyGrade as HikingDifficultyGrade)) {
        throw new UnprocessableEntityException(
          `difficulty_grade "${dto.difficultyGrade}" is not valid for official activities. ` +
          `Allowed values: ${HIKING_DIFFICULTY_GRADES.join(', ')}.`,
        )
      }

      // Numeric constraints for official activities (§2.6 eooa-rules-alignment.md).
      if (dto.maxAltitude <= 0) {
        throw new UnprocessableEntityException('max_altitude must be greater than 0 for official activities.')
      }
      if (dto.totalElevationGain <= 0) {
        throw new UnprocessableEntityException('total_elevation_gain must be greater than 0 for official activities.')
      }

      // Calculate EOOA points using the ScoringService (Phase 6).
      try {
        const rawPoints = this.scoring.calculateHikingPoints({
          maxAltitude: dto.maxAltitude,
          totalElevationGain: dto.totalElevationGain,
          distanceLength: dto.distanceLength,
          fieldType: dto.fieldType,
          difficultyGrade: dto.difficultyGrade,
          participantsNum: dto.participantsNum,
        })
        // Round to 2 decimal places before storing in Decimal(10,2).
        points = Math.round(rawPoints * 100) / 100
      } catch (err) {
        if (err instanceof ScoringError) {
          throw new UnprocessableEntityException(err.message)
        }
        throw err
      }
    }

    // ── Create activity + detail in a single nested write ───────────────────
    // Prisma wraps nested creates in an implicit transaction — both rows are
    // either committed together or rolled back together.
    const activity = await this.prisma.activity.create({
      data: {
        userId: dto.userId,
        clubId: dto.clubId ?? null,
        date: new Date(dto.date),
        category: 'hiking',
        isOfficial: dto.isOfficial,
        points: points !== null ? points : undefined,
        privateNotes: dto.privateNotes ?? null,
        publicNotes: dto.publicNotes ?? null,
        hikingDetail: {
          create: {
            mountain: dto.mountain,
            startPoint: dto.startPoint,
            endPoint: dto.endPoint,
            maxAltitude: dto.maxAltitude,
            totalElevationGain: dto.totalElevationGain,
            distanceLength: dto.distanceLength,
            fieldType: dto.fieldType,
            difficultyGrade: dto.difficultyGrade,
            participantsNum: dto.participantsNum,
          },
        },
      },
      include: { hikingDetail: true },
    })

    return activity
  }

  /**
   * Creates a Rock Climbing activity.
   *
   * Creates both `activities` and `climbing_activity_details` in a single Prisma
   * nested write (implicit transaction).
   *
   * Route snapshot (§3.2, docs/eooa-rules-alignment.md):
   *   The selected Route's identity fields (routeName, mountainOrArea, climbingField)
   *   are fetched from the DB and snapshotted into climbing_activity_details.
   *   The client must NOT send these — they come from the canonical Route only.
   *   altitude and routeLength come from the submitted payload (may be prefilled
   *   from the Route in the UI but are stored as the activity's own values).
   *
   * French scale (§3.6):
   *   If difficultyScale = "french", ScoringService.resolveClimbingGrade() queries
   *   the grade_mappings table. Since grade_mappings is currently empty (Phase 3 TODO),
   *   any French submission will fail with 422 until verified mappings are added.
   *   When a mapping is found, mappedScale and mappedGrade are persisted.
   *
   * Difficulty validation (§3.8):
   *   Official: at least one of (difficultyScale + difficultyGrade) OR mixedClimbing.
   *   Scoring: finalDifficultyCoefficient = max(regular, mixed).
   */
  async createClimbing(dto: CreateClimbingActivityDto) {
    // ── Validate user exists ─────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } })
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`)
    }

    // ── Fetch and validate route ─────────────────────────────────────────────
    // route_id is always required (official and personal).
    const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } })
    if (!route) {
      throw new NotFoundException(`Route with id ${dto.routeId} not found`)
    }

    // ── Validate season and repetition_type (non-nullable in DB) ────────────
    if (!CLIMBING_SEASONS.includes(dto.season as ClimbingSeason)) {
      throw new UnprocessableEntityException(
        `season "${dto.season}" is not valid. Allowed values: ${CLIMBING_SEASONS.join(', ')}.`,
      )
    }
    if (!CLIMBING_REPETITION_TYPES.includes(dto.repetitionType as ClimbingRepetitionType)) {
      throw new UnprocessableEntityException(
        `repetition_type "${dto.repetitionType}" is not valid. Allowed values: ${CLIMBING_REPETITION_TYPES.join(', ')}.`,
      )
    }

    // ── Validate completion_type (optional, both official and personal) ──────
    if (dto.completionType !== undefined) {
      if (!CLIMBING_COMPLETION_TYPES.includes(dto.completionType as ClimbingCompletionType)) {
        throw new UnprocessableEntityException(
          `completion_type "${dto.completionType}" is not valid. ` +
          `Allowed values: ${CLIMBING_COMPLETION_TYPES.join(', ')}.`,
        )
      }
    }

    // ── Resolve difficulty inputs ────────────────────────────────────────────
    const hasRegularDifficulty = !!(dto.difficultyScale && dto.difficultyGrade)
    const hasMixedDifficulty = !!dto.mixedClimbing

    // Validate that difficultyScale and difficultyGrade are always paired.
    if (!!dto.difficultyScale !== !!dto.difficultyGrade) {
      throw new UnprocessableEntityException(
        'difficulty_scale and difficulty_grade must be provided together. ' +
        'Provide both or neither.',
      )
    }

    // ── Official-activity business rules ────────────────────────────────────
    let points: number | null = null
    let mappedScale: string | null = null
    let mappedGrade: string | null = null

    if (dto.isOfficial) {
      // club_id required for official.
      const club = await this.prisma.club.findUnique({ where: { id: dto.clubId! } })
      if (!club) {
        throw new NotFoundException(`Club with id ${dto.clubId} not found`)
      }

      // participants_text required for official records (Excel ΣΥΜ/ΝΤΕΣ column).
      if (!dto.participantsText) {
        throw new UnprocessableEntityException('participants_text is required for official climbing records.')
      }

      // altitude and route_length must be > 0 for official.
      if (dto.altitude <= 0) {
        throw new UnprocessableEntityException('altitude must be greater than 0 for official climbing records.')
      }
      if (dto.routeLength <= 0) {
        throw new UnprocessableEntityException('route_length must be greater than 0 for official climbing records.')
      }

      // At least one difficulty must exist for official records.
      if (!hasRegularDifficulty && !hasMixedDifficulty) {
        throw new UnprocessableEntityException(
          'Official climbing records require at least one of: ' +
          '(difficulty_scale + difficulty_grade) or mixed_climbing.',
        )
      }

      // Validate difficulty_scale value.
      if (hasRegularDifficulty) {
        if (!CLIMBING_DIFFICULTY_SCALES.includes(dto.difficultyScale! as ClimbingDifficultyScale)) {
          throw new UnprocessableEntityException(
            `difficulty_scale "${dto.difficultyScale}" is not valid. ` +
            `Allowed values: ${CLIMBING_DIFFICULTY_SCALES.join(', ')}.`,
          )
        }
      }

      // Validate mixed_climbing grade.
      if (hasMixedDifficulty) {
        if (!CLIMBING_MIXED_GRADES.includes(dto.mixedClimbing! as ClimbingMixedGrade)) {
          throw new UnprocessableEntityException(
            `mixed_climbing "${dto.mixedClimbing}" is not valid. ` +
            `Allowed values: M1–M12, WI1–WI12.`,
          )
        }
      }

      // ── French scale resolution (§3.6) ──────────────────────────────────
      // Resolve French grade → UIAA/Alpine via grade_mappings table.
      // This will throw ScoringError while grade_mappings is empty (Phase 3 TODO).
      // When a mapping is found, persist mapped_scale and mapped_grade.
      if (hasRegularDifficulty && dto.difficultyScale === 'french') {
        try {
          const resolved = await this.scoring.resolveClimbingGrade(dto.difficultyGrade!)
          mappedScale = resolved.mappedScale
          mappedGrade = resolved.mappedGrade
        } catch (err) {
          if (err instanceof ScoringError) {
            throw new UnprocessableEntityException(err.message)
          }
          throw err
        }
      }

      // ── Validate UIAA/Alpine grade value (when not French) ───────────────
      // When difficultyScale is "uiaa" (includes Alpine grades), validate the grade.
      if (hasRegularDifficulty && dto.difficultyScale !== 'french') {
        const gradeToCheck = dto.difficultyGrade!
        if (!CLIMBING_UIAA_GRADES.includes(gradeToCheck as ClimbingUiaaGrade)) {
          throw new UnprocessableEntityException(
            `difficulty_grade "${gradeToCheck}" is not a valid UIAA/Alpine grade. ` +
            `Allowed values include: IV, IV+, V, V+, VI, VI+, VII, VII+, VIII, D, TD, ED, etc.`,
          )
        }
      }

      // ── Calculate points (§3.13) ─────────────────────────────────────────
      try {
        const rawPoints = await this.scoring.calculateClimbingPoints({
          altitude: dto.altitude,
          routeLength: dto.routeLength,
          season: dto.season,
          repetitionType: dto.repetitionType,
          participantsNum: dto.participantsNum,
          difficultyScale: dto.difficultyScale ?? null,
          difficultyGrade: dto.difficultyGrade ?? null,
          mappedGrade: mappedGrade,
          mixedClimbing: dto.mixedClimbing ?? null,
        })
        points = Math.round(rawPoints * 100) / 100
      } catch (err) {
        if (err instanceof ScoringError) {
          throw new UnprocessableEntityException(err.message)
        }
        throw err
      }
    } else {
      // ── Personal: validate difficulty fields if present ──────────────────
      // Validate difficultyScale only if the user provides one.
      if (hasRegularDifficulty && dto.difficultyScale) {
        if (!CLIMBING_DIFFICULTY_SCALES.includes(dto.difficultyScale as ClimbingDifficultyScale)) {
          throw new UnprocessableEntityException(
            `difficulty_scale "${dto.difficultyScale}" is not valid. ` +
            `Allowed values: ${CLIMBING_DIFFICULTY_SCALES.join(', ')}.`,
          )
        }
      }
      // Validate mixed_climbing grade if provided.
      if (hasMixedDifficulty) {
        if (!CLIMBING_MIXED_GRADES.includes(dto.mixedClimbing! as ClimbingMixedGrade)) {
          throw new UnprocessableEntityException(
            `mixed_climbing "${dto.mixedClimbing}" is not valid. Allowed values: M1–M12, WI1–WI12.`,
          )
        }
      }
    }

    // ── Create activity + detail in a single nested write ───────────────────
    // Route identity fields are snapshotted from the canonical Route (§3.2).
    // The client payload does NOT include routeName, mountainOrArea, climbingField.
    const activity = await this.prisma.activity.create({
      data: {
        userId: dto.userId,
        clubId: dto.clubId ?? null,
        date: new Date(dto.date),
        category: 'climbing',
        isOfficial: dto.isOfficial,
        points: points !== null ? points : undefined,
        privateNotes: dto.privateNotes ?? null,
        publicNotes: dto.publicNotes ?? null,
        climbingDetail: {
          create: {
            routeId: dto.routeId,
            // ── Route identity snapshot (read-only fields from the Route) ──
            routeName: route.name,
            mountainOrArea: route.mountainOrArea,
            climbingField: route.climbingField,
            // ── Activity-specific values ───────────────────────────────────
            season: dto.season,
            repetitionType: dto.repetitionType,
            altitude: dto.altitude,
            routeLength: dto.routeLength,
            participantsNum: dto.participantsNum,
            participantsText: dto.participantsText ?? '',
            completionType: dto.completionType ?? null,
            // ── Difficulty ─────────────────────────────────────────────────
            difficultyScale: dto.difficultyScale ?? null,
            difficultyGrade: dto.difficultyGrade ?? null,
            mappedScale: mappedScale,
            mappedGrade: mappedGrade,
            mixedClimbing: dto.mixedClimbing ?? null,
          },
        },
      },
      include: { climbingDetail: true },
    })

    return activity
  }

  /**
   * Creates an Expeditions Abroad activity.
   *
   * Creates both `activities` and `expedition_activity_details` in a single Prisma
   * nested write (implicit transaction).
   *
   * Official activities (is_official = true):
   *   - club_id is required and must resolve to an existing club.
   *   - season must be "summer" or "winter" (ski mountaineering ⇒ use "winter").
   *   - altitude and total_elevation_gain must be > 0.
   *   - difficulty_grade must be one of the EOOA expedition grades (different table
   *     from hiking — do NOT mix up the coefficient tables).
   *   - organization_type must be one of: no, europe, africa, other_continents.
   *   - Points are calculated via ScoringService and rounded to 2 d.p.
   *   - No minimum participants restriction (§4.5).
   *
   * Personal activities (is_official = false):
   *   - club_id optional.
   *   - difficulty_grade can be any non-empty string.
   *   - season and organization_type are still validated against allowed values
   *     because all DB columns are non-nullable and the allowed sets are fixed.
   *   - Points remain null.
   */
  async createExpedition(dto: CreateExpeditionActivityDto) {
    // ── Validate user exists ─────────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } })
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`)
    }

    // ── Validate season (both official and personal — fixed allowed set) ─────
    if (!EXPEDITION_SEASONS.includes(dto.season as ExpeditionSeason)) {
      throw new UnprocessableEntityException(
        `season "${dto.season}" is not valid for expeditions. ` +
        `Allowed values: ${EXPEDITION_SEASONS.join(', ')}. ` +
        `Note: ski-mountaineering conditions should use "winter".`,
      )
    }

    // ── Validate organization_type (both — fixed allowed set) ───────────────
    if (!EXPEDITION_ORGANIZATION_TYPES.includes(dto.organizationType as ExpeditionOrganizationType)) {
      throw new UnprocessableEntityException(
        `organization_type "${dto.organizationType}" is not valid. ` +
        `Allowed values: ${EXPEDITION_ORGANIZATION_TYPES.join(', ')}. ` +
        `Use "no" when the expedition was not organized by the club.`,
      )
    }

    // ── Official-activity business rules ────────────────────────────────────
    let points: number | null = null

    if (dto.isOfficial) {
      // club_id required for official.
      const club = await this.prisma.club.findUnique({ where: { id: dto.clubId! } })
      if (!club) {
        throw new NotFoundException(`Club with id ${dto.clubId} not found`)
      }

      // difficulty_grade must be from the EOOA expedition table (§4.3).
      // IMPORTANT: expedition uses a different coefficient table than hiking.
      if (!EXPEDITION_DIFFICULTY_GRADES.includes(dto.difficultyGrade as ExpeditionDifficultyGrade)) {
        throw new UnprocessableEntityException(
          `difficulty_grade "${dto.difficultyGrade}" is not valid for official expedition activities. ` +
          `Allowed values: ${EXPEDITION_DIFFICULTY_GRADES.join(', ')}.`,
        )
      }

      // altitude and total_elevation_gain must be > 0 for official (§4.4).
      if (dto.altitude <= 0) {
        throw new UnprocessableEntityException('altitude must be greater than 0 for official expedition activities.')
      }
      if (dto.totalElevationGain <= 0) {
        throw new UnprocessableEntityException('total_elevation_gain must be greater than 0 for official expedition activities.')
      }

      // Calculate EOOA points (§4.7).
      // No minimum participants restriction for expeditions (§4.5).
      try {
        const rawPoints = this.scoring.calculateExpeditionPoints({
          altitude: dto.altitude,
          totalElevationGain: dto.totalElevationGain,
          season: dto.season,
          difficultyGrade: dto.difficultyGrade,
          participantsNum: dto.participantsNum,
          organizationType: dto.organizationType,
        })
        points = Math.round(rawPoints * 100) / 100
      } catch (err) {
        if (err instanceof ScoringError) {
          throw new UnprocessableEntityException(err.message)
        }
        throw err
      }
    }

    // ── Create activity + detail in a single nested write ───────────────────
    const activity = await this.prisma.activity.create({
      data: {
        userId: dto.userId,
        clubId: dto.clubId ?? null,
        date: new Date(dto.date),
        category: 'expedition',
        isOfficial: dto.isOfficial,
        points: points !== null ? points : undefined,
        privateNotes: dto.privateNotes ?? null,
        publicNotes: dto.publicNotes ?? null,
        expeditionDetail: {
          create: {
            country: dto.country,
            mountainRange: dto.mountainRange,
            mountain: dto.mountain,
            summit: dto.summit,
            routeName: dto.routeName,
            season: dto.season,
            altitude: dto.altitude,
            totalElevationGain: dto.totalElevationGain,
            difficultyGrade: dto.difficultyGrade,
            participantsNum: dto.participantsNum,
            organizationType: dto.organizationType,
          },
        },
      },
      include: { expeditionDetail: true },
    })

    return activity
  }
}
