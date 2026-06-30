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
  CLIMBING_FRENCH_GRADES,
  CLIMBING_MIXED_GRADES,
  CLIMBING_REPETITION_TYPES,
  CLIMBING_SEASONS,
  CLIMBING_UIAA_GRADES,
  ClimbingCompletionType,
  ClimbingDifficultyScale,
  ClimbingFrenchGrade,
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
import { PatchActivityDto } from './dto/patch-activity.dto'
import { GetActivitiesDto } from './dto/get-activities.dto'
import { PreviewPointsDto, type PreviewPointsResult } from './dto/preview-points.dto'

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Resolves the authenticated user's club ID for official activity creation.
   *
   * MVP rule: one primary club per user.
   *   - 0 memberships → 422 (official activities require club membership).
   *   - 1 membership  → returns that club's id.
   *   - 2+ memberships → 422 (edge case from dev data; admin must resolve).
   *
   * The caller must pass the JWT-verified user id.
   * The DTO's clubId is intentionally ignored here — it comes from the user's
   * verified membership, not from untrusted request input.
   */
  private async resolveOfficialClubId(callerUserId: string): Promise<string> {
    const memberships = await this.prisma.clubMembership.findMany({
      where: { userId: callerUserId },
    })

    if (memberships.length === 0) {
      throw new UnprocessableEntityException(
        'Official activities require a club membership. ' +
        'Your account is not a member of any club. ' +
        'Register with a club or contact an administrator.',
      )
    }

    if (memberships.length > 1) {
      // MVP assumes one primary club. Multiple memberships from dev/seed data
      // should be resolved manually. Phase 12 will add a "primary club" concept.
      throw new UnprocessableEntityException(
        'Your account has multiple club memberships. ' +
        'The current MVP supports one primary club per user. ' +
        'Contact an administrator to set your primary club.',
      )
    }

    return memberships[0].clubId
  }

  // ── Create endpoints ────────────────────────────────────────────────────────

  /**
   * Creates a Hiking / Ski Mountaineering activity.
   *
   * @param dto          Request body (validated by DTO).
   * @param callerUserId JWT-verified user id from req.user.sub — the only trusted source of ownership.
   *
   * Creates both `activities` and `hiking_activity_details` in a single Prisma
   * nested write (treated as an implicit transaction).
   *
   * Official activities (is_official = true):
   *   - clubId is inferred from the user's ClubMembership (not from dto.clubId).
   *   - Users without a club membership cannot create official activities.
   *   - field_type must be one of the EOOA-recognised values.
   *   - difficulty_grade must be one of the EOOA-recognised hiking grades.
   *   - max_altitude and total_elevation_gain must be > 0.
   *   - Points are calculated via ScoringService and rounded to 2 d.p.
   *
   * Personal activities (is_official = false):
   *   - clubId is always null (never inferred from membership).
   *   - field_type and difficulty_grade can be any non-empty string.
   *   - Numeric ranges are more relaxed (see DTO).
   *   - Points remain null.
   */
  async createHiking(dto: CreateHikingActivityDto, callerUserId: string) {
    // ── Validate caller exists (safety net for deleted users with valid tokens) ─
    const user = await this.prisma.user.findUnique({ where: { id: callerUserId } })
    if (!user) {
      throw new NotFoundException(`User with id ${callerUserId} not found`)
    }

    // Distance (km): official empty/invalid → EOOA minimum 15 km (same floor as sqrt(max(d/15,1))).
    const distanceKmStored = dto.isOfficial
      ? (() => {
          const v =
            dto.distanceLength === undefined || dto.distanceLength === null ? NaN : Number(dto.distanceLength)
          return !Number.isFinite(v) || v <= 0 ? 15 : v
        })()
      : (() => {
          const v =
            dto.distanceLength === undefined || dto.distanceLength === null ? NaN : Number(dto.distanceLength)
          return !Number.isFinite(v) || v < 0 ? 0 : v
        })()

    // ── Official-activity business rules ────────────────────────────────────
    let points: number | null = null
    let officialClubId: string | null = null

    if (dto.isOfficial) {
      // clubId is inferred from the user's membership.
      // dto.clubId is intentionally ignored.
      officialClubId = await this.resolveOfficialClubId(callerUserId)

      // Official hiking requires at least 3 participants (EOOA rule).
      if (dto.participantsNum < 3) {
        throw new UnprocessableEntityException(
          'Official hiking activities require at least 3 participants.',
        )
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

      // Numeric constraints for official activities.
      if (dto.maxAltitude <= 0) {
        throw new UnprocessableEntityException('max_altitude must be greater than 0 for official activities.')
      }
      if (dto.totalElevationGain <= 0) {
        throw new UnprocessableEntityException('total_elevation_gain must be greater than 0 for official activities.')
      }

      // Calculate EOOA points.
      try {
        const rawPoints = this.scoring.calculateHikingPoints({
          maxAltitude: dto.maxAltitude,
          totalElevationGain: dto.totalElevationGain,
          distanceLength: distanceKmStored,
          fieldType: dto.fieldType,
          difficultyGrade: dto.difficultyGrade,
          participantsNum: dto.participantsNum,
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
        userId: callerUserId,
        // Official: inferred from membership. Personal: always null.
        clubId: officialClubId,
        date: new Date(dto.date),
        category: 'hiking',
        isOfficial: dto.isOfficial,
        points: points !== null ? points : undefined,
        privateNotes: dto.privateNotes ?? null,
        publicNotes: dto.publicNotes ?? null,
        hikingDetail: {
          create: {
            mountain: dto.mountain,
            startPoint: dto.startPoint ?? '',
            endPoint: dto.endPoint ?? '',
            maxAltitude: dto.maxAltitude,
            totalElevationGain: dto.totalElevationGain,
            distanceLength: distanceKmStored,
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
   * @param dto          Request body (validated by DTO).
   * @param callerUserId JWT-verified user id from req.user.sub — the only trusted source of ownership.
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
   *   the grade_mappings table. Unmapped French grades will fail with 422.
   *
   * Difficulty validation (§3.8):
   *   Official: at least one of (difficultyScale + difficultyGrade) OR mixedClimbing.
   *   Scoring: finalDifficultyCoefficient = max(regular, mixed).
   */
  async createClimbing(dto: CreateClimbingActivityDto, callerUserId: string) {
    // ── Validate caller exists ───────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: callerUserId } })
    if (!user) {
      throw new NotFoundException(`User with id ${callerUserId} not found`)
    }

    // ── Fetch and validate route ─────────────────────────────────────────────
    const route = await this.prisma.route.findUnique({ where: { id: dto.routeId } })
    if (!route) {
      throw new NotFoundException(`Route with id ${dto.routeId} not found`)
    }

    // ── Validate season and repetition_type ─────────────────────────────────
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

    // ── Validate completion_type ─────────────────────────────────────────────
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

    // scale and grade must always be paired.
    if (!!dto.difficultyScale !== !!dto.difficultyGrade) {
      throw new UnprocessableEntityException(
        'difficulty_scale and difficulty_grade must be provided together. ' +
        'Provide both or neither.',
      )
    }

    // Optional altitude/routeLength: store 0 when omitted (Phase A sentinel). EOOA floors
    // (altitude 1000 m, routeLength 100 m) are applied only at scoring time, not in the DB.
    const persistAltitude =
      dto.altitude != null && Number(dto.altitude) >= 1
        ? Math.round(Number(dto.altitude))
        : 0
    const persistRouteLength =
      dto.routeLength != null && Number(dto.routeLength) >= 0.01
        ? Number(dto.routeLength)
        : 0
    const scoringAltitude = dto.isOfficial
      ? persistAltitude >= 1
        ? persistAltitude
        : 1000
      : persistAltitude
    const scoringRouteLength = dto.isOfficial
      ? persistRouteLength >= 0.01
        ? persistRouteLength
        : 100
      : persistRouteLength

    // ── Official-activity business rules ────────────────────────────────────
    let points: number | null = null
    let mappedScale: string | null = null
    let mappedGrade: string | null = null
    let officialClubId: string | null = null

    if (dto.isOfficial) {
      // clubId is inferred from the user's membership.
      // dto.clubId is intentionally ignored.
      officialClubId = await this.resolveOfficialClubId(callerUserId)

      // participants_text required for official records when there are additional partners.
      if (dto.participantsNum > 1 && !dto.participantsText) {
        throw new UnprocessableEntityException('participants_text is required for official climbing records when participantsNum > 1.')
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

      // French scale resolution (§3.6).
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

      // Validate UIAA/Alpine grade when not French.
      if (hasRegularDifficulty && dto.difficultyScale !== 'french') {
        const gradeToCheck = dto.difficultyGrade!
        if (!CLIMBING_UIAA_GRADES.includes(gradeToCheck as ClimbingUiaaGrade)) {
          throw new UnprocessableEntityException(
            `difficulty_grade "${gradeToCheck}" is not a valid UIAA/Alpine grade. ` +
            `Allowed values include: IV, IV+, V, V+, VI, VI+, VII, VII+, VIII, D, TD, ED, etc.`,
          )
        }
      }

      // Calculate points.
      try {
        const rawPoints = await this.scoring.calculateClimbingPoints({
          altitude: scoringAltitude,
          routeLength: scoringRouteLength,
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
      if (hasRegularDifficulty) {
        if (!CLIMBING_DIFFICULTY_SCALES.includes(dto.difficultyScale! as ClimbingDifficultyScale)) {
          throw new UnprocessableEntityException(
            `difficulty_scale "${dto.difficultyScale}" is not valid. ` +
            `Allowed values: ${CLIMBING_DIFFICULTY_SCALES.join(', ')}.`,
          )
        }

        if (dto.difficultyScale === 'french') {
          if (!CLIMBING_FRENCH_GRADES.includes(dto.difficultyGrade! as ClimbingFrenchGrade)) {
            throw new UnprocessableEntityException(
              `difficulty_grade "${dto.difficultyGrade}" is not a valid French grade. ` +
              `Allowed values: ${CLIMBING_FRENCH_GRADES.join(', ')}.`,
            )
          }
        } else {
          if (!CLIMBING_UIAA_GRADES.includes(dto.difficultyGrade! as ClimbingUiaaGrade)) {
            throw new UnprocessableEntityException(
              `difficulty_grade "${dto.difficultyGrade}" is not a valid UIAA/Alpine grade. ` +
              `Allowed values include: IV, IV+, V, V+, VI, VI+, VII, VII+, VIII, D, TD, ED, etc.`,
            )
          }
        }
      }

      if (hasMixedDifficulty) {
        if (!CLIMBING_MIXED_GRADES.includes(dto.mixedClimbing! as ClimbingMixedGrade)) {
          throw new UnprocessableEntityException(
            `mixed_climbing "${dto.mixedClimbing}" is not valid. Allowed values: M1–M12, WI1–WI12.`,
          )
        }
      }
    }

    // ── Create activity + detail in a single nested write ───────────────────
    const activity = await this.prisma.activity.create({
      data: {
        userId: callerUserId,
        // Official: inferred from membership. Personal: always null.
        clubId: officialClubId,
        date: new Date(dto.date),
        category: 'climbing',
        isOfficial: dto.isOfficial,
        points: points !== null ? points : undefined,
        privateNotes: dto.privateNotes ?? null,
        publicNotes: dto.publicNotes ?? null,
        climbingDetail: {
          create: {
            routeId: dto.routeId,
            routeName: route.name,
            mountainOrArea: route.mountainOrArea,
            climbingField: route.climbingField,
            season: dto.season,
            repetitionType: dto.repetitionType,
            // TODO (Phase B): once altitude and routeLength columns are made nullable via
            //   Prisma migration, replace ?? 0 with ?? null so personal records without
            //   these values store NULL instead of the sentinel 0.
            altitude: persistAltitude,
            routeLength: persistRouteLength,
            participantsNum: dto.participantsNum,
            participantsText: dto.participantsText ?? '',
            completionType: dto.completionType ?? null,
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
   * @param dto          Request body (validated by DTO).
   * @param callerUserId JWT-verified user id from req.user.sub — the only trusted source of ownership.
   *
   * Official activities (is_official = true):
   *   - clubId is inferred from the user's ClubMembership (not from dto.clubId).
   *   - season must be "summer" or "winter".
   *   - altitude and total_elevation_gain must be > 0.
   *   - difficulty_grade must be one of the EOOA expedition grades.
   *   - organization_type must be one of: no, europe, africa, other_continents.
   *   - Points are calculated via ScoringService and rounded to 2 d.p.
   *
   * Personal activities (is_official = false):
   *   - clubId is always null.
   *   - difficulty_grade optional.
   *   - Points remain null.
   */
  async createExpedition(dto: CreateExpeditionActivityDto, callerUserId: string) {
    // ── Validate caller exists ───────────────────────────────────────────────
    const user = await this.prisma.user.findUnique({ where: { id: callerUserId } })
    if (!user) {
      throw new NotFoundException(`User with id ${callerUserId} not found`)
    }

    // ── Validate difficultyGrade if provided ─────────────────────────────────
    if (dto.difficultyGrade && !EXPEDITION_DIFFICULTY_GRADES.includes(dto.difficultyGrade as ExpeditionDifficultyGrade)) {
      throw new UnprocessableEntityException(
        `difficulty_grade "${dto.difficultyGrade}" is not valid. ` +
        `Allowed values: ${EXPEDITION_DIFFICULTY_GRADES.join(', ')}.`,
      )
    }

    // ── Validate season ──────────────────────────────────────────────────────
    if (!EXPEDITION_SEASONS.includes(dto.season as ExpeditionSeason)) {
      throw new UnprocessableEntityException(
        `season "${dto.season}" is not valid for expeditions. ` +
        `Allowed values: ${EXPEDITION_SEASONS.join(', ')}. ` +
        `Note: ski-mountaineering conditions should use "winter".`,
      )
    }

    // ── Validate organization_type ───────────────────────────────────────────
    if (!EXPEDITION_ORGANIZATION_TYPES.includes(dto.organizationType as ExpeditionOrganizationType)) {
      throw new UnprocessableEntityException(
        `organization_type "${dto.organizationType}" is not valid. ` +
        `Allowed values: ${EXPEDITION_ORGANIZATION_TYPES.join(', ')}. ` +
        `Use "no" when the expedition was not organized by the club.`,
      )
    }

    // ── Official-activity business rules ────────────────────────────────────
    let points: number | null = null
    let officialClubId: string | null = null

    if (dto.isOfficial) {
      // clubId is inferred from the user's membership.
      // dto.clubId is intentionally ignored.
      officialClubId = await this.resolveOfficialClubId(callerUserId)

      // difficulty_grade is required for official records.
      if (!dto.difficultyGrade) {
        throw new UnprocessableEntityException(
          'difficulty_grade is required for official expedition activities.',
        )
      }

      // altitude and total_elevation_gain must be > 0 for official.
      if (!dto.altitude || dto.altitude <= 0) {
        throw new UnprocessableEntityException('altitude must be greater than 0 for official expedition activities.')
      }
      if (dto.totalElevationGain === undefined || dto.totalElevationGain <= 0) {
        throw new UnprocessableEntityException('total_elevation_gain must be greater than 0 for official expedition activities.')
      }

      // Calculate EOOA points.
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
        userId: callerUserId,
        // Official: inferred from membership. Personal: always null.
        clubId: officialClubId,
        date: new Date(dto.date),
        category: 'expedition',
        isOfficial: dto.isOfficial,
        points: points !== null ? points : undefined,
        privateNotes: dto.privateNotes ?? null,
        publicNotes: dto.publicNotes ?? null,
        expeditionDetail: {
          create: {
            country: dto.country,
            mountainRange: dto.mountainRange ?? '',
            mountain: dto.mountain,
            summit: dto.summit ?? '',
            routeName: dto.routeName ?? '',
            season: dto.season,
            // TODO (Phase B): once altitude and totalElevationGain columns are made nullable
            //   via Prisma migration, replace ?? 0 with ?? null so personal records without
            //   these values store NULL instead of the sentinel 0.
            altitude: dto.altitude ?? 0,
            totalElevationGain: dto.totalElevationGain ?? 0,
            difficultyGrade: dto.difficultyGrade ?? '',
            participantsNum: dto.participantsNum,
            organizationType: dto.organizationType,
          },
        },
      },
      include: { expeditionDetail: true },
    })

    return activity
  }

  // ── Activity retrieval ──────────────────────────────────────────────────────

  /**
   * Returns all activities for the authenticated user.
   *
   * @param dto          Query parameters (category filter, pagination).
   *                     dto.userId is present for backward compat but IGNORED.
   * @param callerUserId JWT-verified user id from req.user.sub.
   *
   * All three detail relations are always included; exactly one will be non-null
   * per activity. Ordering: date descending (most recent first).
   */
  findAllForUser(dto: GetActivitiesDto, callerUserId: string) {
    return this.prisma.activity.findMany({
      where: {
        // Only activities that belong to the authenticated user.
        userId: callerUserId,
        ...(dto.category ? { category: dto.category } : {}),
      },
      include: {
        hikingDetail: true,
        climbingDetail: true,
        expeditionDetail: true,
      },
      orderBy: { date: 'desc' },
      take: dto.take ?? 20,
      skip: dto.skip ?? 0,
    })
  }

  /**
   * Returns a single activity by id — only if it belongs to the caller.
   *
   * @param id           Activity UUID.
   * @param callerUserId JWT-verified user id from req.user.sub.
   *
   * Returns 404 if the activity does not exist or belongs to a different user.
   * Never returns 403 — to avoid revealing that the activity exists and
   * belongs to a different user.
   */
  async findById(id: string, callerUserId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        hikingDetail: true,
        climbingDetail: true,
        expeditionDetail: true,
      },
    })

    if (!activity) {
      throw new NotFoundException(`Activity with id ${id} not found`)
    }

    // Ownership check: different user → 404 (not 403) to avoid ownership leakage.
    if (activity.userId !== callerUserId) {
      throw new NotFoundException(`Activity with id ${id} not found`)
    }

    return activity
  }

  // ── Edit (PATCH) ────────────────────────────────────────────────────────────

  /**
   * Patches an activity owned by the caller.
   *
   * MVP immutable fields (category, isOfficial, userId, clubId, createdAt, and routeId
   * for climbing) are excluded from PatchActivityDto — the global ValidationPipe will
   * reject any attempt to send them with a 400 before this method is called.
   *
   * The service:
   *  1. Loads the existing activity + detail.
   *  2. Returns 404 if not found or belongs to a different user (ownership-hiding 404).
   *  3. Merges each incoming field with the stored value (missing fields keep existing).
   *  4. Re-validates the effective values against official or personal rules.
   *  5. Keeps the existing clubId — never infers or accepts a new one on edit.
   *  6. Recalculates points for official activities; keeps null for personal.
   */
  async patchActivity(id: string, dto: PatchActivityDto, callerUserId: string) {
    const existing = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        hikingDetail: true,
        climbingDetail: true,
        expeditionDetail: true,
      },
    })

    // 404 whether the activity doesn't exist or belongs to another user.
    if (!existing || existing.userId !== callerUserId) {
      throw new NotFoundException(`Activity with id ${id} not found`)
    }

    if (existing.category === 'hiking') {
      return this.applyHikingPatch(existing as any, dto)
    }
    if (existing.category === 'climbing') {
      return this.applyClimbingPatch(existing as any, dto)
    }
    if (existing.category === 'expedition') {
      return this.applyExpeditionPatch(existing as any, dto)
    }

    throw new UnprocessableEntityException(`Unknown activity category: ${existing.category}`)
  }

  /** Applies a hiking activity patch. Called only when existing.category === 'hiking'. */
  private async applyHikingPatch(
    existing: {
      id: string
      isOfficial: boolean
      points: any
      date: Date
      privateNotes: string | null
      publicNotes: string | null
      hikingDetail: {
        mountain: string
        startPoint: string
        endPoint: string
        maxAltitude: number
        totalElevationGain: number
        distanceLength: any
        fieldType: string
        difficultyGrade: string
        participantsNum: number
      }
    },
    dto: PatchActivityDto,
  ) {
    const d = existing.hikingDetail

    // Merge: use incoming value when provided, otherwise fall back to stored value.
    const mountain           = dto.mountain           ?? d.mountain
    const startPoint         = dto.startPoint         ?? d.startPoint
    const endPoint           = dto.endPoint           ?? d.endPoint
    const maxAltitude        = dto.maxAltitude        ?? d.maxAltitude
    const totalElevationGain = dto.totalElevationGain ?? d.totalElevationGain
    const distanceLengthMerged = dto.distanceLength !== undefined ? Number(dto.distanceLength) : Number(d.distanceLength)
    const distanceLength =
      existing.isOfficial && (!Number.isFinite(distanceLengthMerged) || distanceLengthMerged <= 0)
        ? 15
        : !Number.isFinite(distanceLengthMerged) || distanceLengthMerged < 0
          ? 0
          : distanceLengthMerged
    const fieldType          = dto.fieldType          ?? d.fieldType
    const difficultyGrade    = dto.difficultyGrade    ?? d.difficultyGrade
    const participantsNum    = dto.participantsNum    ?? d.participantsNum

    let points: number | null

    if (existing.isOfficial) {
      // ── Official re-validation ────────────────────────────────────────────
      if (participantsNum < 3) {
        throw new UnprocessableEntityException(
          'Official hiking activities require at least 3 participants.',
        )
      }
      if (!HIKING_FIELD_TYPES.includes(fieldType as HikingFieldType)) {
        throw new UnprocessableEntityException(
          `field_type "${fieldType}" is not valid for official activities. ` +
          `Allowed values: ${HIKING_FIELD_TYPES.join(', ')}.`,
        )
      }
      if (!HIKING_DIFFICULTY_GRADES.includes(difficultyGrade as HikingDifficultyGrade)) {
        throw new UnprocessableEntityException(
          `difficulty_grade "${difficultyGrade}" is not valid for official activities. ` +
          `Allowed values: ${HIKING_DIFFICULTY_GRADES.join(', ')}.`,
        )
      }
      if (maxAltitude <= 0) {
        throw new UnprocessableEntityException('max_altitude must be greater than 0 for official activities.')
      }
      if (totalElevationGain <= 0) {
        throw new UnprocessableEntityException('total_elevation_gain must be greater than 0 for official activities.')
      }

      // Recalculate points.
      try {
        const raw = this.scoring.calculateHikingPoints({
          maxAltitude,
          totalElevationGain,
          distanceLength,
          fieldType,
          difficultyGrade,
          participantsNum,
        })
        points = Math.round(raw * 100) / 100
      } catch (err) {
        if (err instanceof ScoringError) throw new UnprocessableEntityException(err.message)
        throw err
      }
    } else {
      points = null
    }

    return this.prisma.activity.update({
      where: { id: existing.id },
      data: {
        date: dto.date ? new Date(dto.date) : existing.date,
        points: points !== null ? points : null,
        privateNotes: dto.privateNotes !== undefined ? dto.privateNotes : existing.privateNotes,
        publicNotes:  dto.publicNotes  !== undefined ? dto.publicNotes  : existing.publicNotes,
        hikingDetail: {
          update: {
            mountain,
            startPoint,
            endPoint,
            maxAltitude,
            totalElevationGain,
            distanceLength,
            fieldType,
            difficultyGrade,
            participantsNum,
          },
        },
      },
      include: { hikingDetail: true },
    })
  }

  /** Applies a climbing activity patch. Called only when existing.category === 'climbing'. */
  private async applyClimbingPatch(
    existing: {
      id: string
      isOfficial: boolean
      points: any
      date: Date
      privateNotes: string | null
      publicNotes: string | null
      climbingDetail: {
        routeId: string
        routeName: string
        mountainOrArea: string
        climbingField: string
        season: string
        repetitionType: string
        altitude: number
        routeLength: any
        participantsNum: number
        participantsText: string
        completionType: string | null
        difficultyScale: string | null
        difficultyGrade: string | null
        mappedScale: string | null
        mappedGrade: string | null
        mixedClimbing: string | null
      }
    },
    dto: PatchActivityDto,
  ) {
    const d = existing.climbingDetail

    // Merge fields — snapshot fields (routeId, routeName, mountainOrArea, climbingField) are never changed.
    const season          = dto.season          ?? d.season
    const repetitionType  = dto.repetitionType  ?? d.repetitionType
    const persistAltitude =
      dto.altitude !== undefined
        ? Number.isFinite(Number(dto.altitude)) && Number(dto.altitude) >= 1
          ? Math.round(Number(dto.altitude))
          : 0
        : d.altitude
    const persistRouteLength =
      dto.routeLength !== undefined
        ? Number.isFinite(Number(dto.routeLength)) && Number(dto.routeLength) >= 0.01
          ? Number(dto.routeLength)
          : 0
        : Number(d.routeLength)
    const scoringAltitude = existing.isOfficial
      ? persistAltitude >= 1
        ? persistAltitude
        : 1000
      : persistAltitude
    const scoringRouteLength = existing.isOfficial
      ? persistRouteLength >= 0.01
        ? persistRouteLength
        : 100
      : persistRouteLength
    const participantsNum = dto.participantsNum  ?? d.participantsNum
    const participantsText = dto.participantsText !== undefined ? dto.participantsText : d.participantsText
    const completionType  = dto.completionType  !== undefined ? dto.completionType : d.completionType
    const mixedClimbing   = dto.mixedClimbing   !== undefined ? dto.mixedClimbing : d.mixedClimbing

    // Difficulty: handle scale+grade pair atomically.
    // If client sends one but not the other, merge with the stored partner.
    let difficultyScale = d.difficultyScale
    let difficultyGrade = d.difficultyGrade
    if (dto.difficultyScale !== undefined || dto.difficultyGrade !== undefined) {
      difficultyScale = dto.difficultyScale !== undefined ? dto.difficultyScale : d.difficultyScale
      difficultyGrade = dto.difficultyGrade !== undefined ? dto.difficultyGrade : d.difficultyGrade
    }

    // scale and grade must always be paired.
    if (!!difficultyScale !== !!difficultyGrade) {
      throw new UnprocessableEntityException(
        'difficulty_scale and difficulty_grade must be provided together. Provide both or neither.',
      )
    }

    const hasRegularDifficulty = !!(difficultyScale && difficultyGrade)
    const hasMixedDifficulty   = !!mixedClimbing

    let points: number | null
    let mappedScale: string | null = d.mappedScale
    let mappedGrade: string | null = d.mappedGrade

    // Re-resolve French grade mapping only if the scale/grade changed.
    const frenchScaleChanged = dto.difficultyScale !== undefined || dto.difficultyGrade !== undefined
    const isFrench = difficultyScale === 'french'
    if (isFrench && hasRegularDifficulty && frenchScaleChanged) {
      mappedScale = null
      mappedGrade = null
    }

    if (existing.isOfficial) {
      // Validate season + repetition_type.
      if (!CLIMBING_SEASONS.includes(season as ClimbingSeason)) {
        throw new UnprocessableEntityException(
          `season "${season}" is not valid. Allowed values: ${CLIMBING_SEASONS.join(', ')}.`,
        )
      }
      if (!CLIMBING_REPETITION_TYPES.includes(repetitionType as ClimbingRepetitionType)) {
        throw new UnprocessableEntityException(
          `repetition_type "${repetitionType}" is not valid. Allowed values: ${CLIMBING_REPETITION_TYPES.join(', ')}.`,
        )
      }
      if (!hasRegularDifficulty && !hasMixedDifficulty) {
        throw new UnprocessableEntityException(
          'Official climbing records require at least one of: (difficulty_scale + difficulty_grade) or mixed_climbing.',
        )
      }
      if (hasRegularDifficulty) {
        if (!CLIMBING_DIFFICULTY_SCALES.includes(difficultyScale! as ClimbingDifficultyScale)) {
          throw new UnprocessableEntityException(
            `difficulty_scale "${difficultyScale}" is not valid. Allowed values: ${CLIMBING_DIFFICULTY_SCALES.join(', ')}.`,
          )
        }
      }
      if (hasMixedDifficulty) {
        if (!CLIMBING_MIXED_GRADES.includes(mixedClimbing! as ClimbingMixedGrade)) {
          throw new UnprocessableEntityException(
            `mixed_climbing "${mixedClimbing}" is not valid. Allowed values: M1–M12, WI1–WI12.`,
          )
        }
      }
      if (completionType !== undefined && completionType !== null) {
        if (!CLIMBING_COMPLETION_TYPES.includes(completionType as ClimbingCompletionType)) {
          throw new UnprocessableEntityException(
            `completion_type "${completionType}" is not valid. Allowed values: ${CLIMBING_COMPLETION_TYPES.join(', ')}.`,
          )
        }
      }
      // French grade resolution.
      if (isFrench && hasRegularDifficulty) {
        try {
          const resolved = await this.scoring.resolveClimbingGrade(difficultyGrade!)
          mappedScale = resolved.mappedScale
          mappedGrade = resolved.mappedGrade
        } catch (err) {
          if (err instanceof ScoringError) throw new UnprocessableEntityException(err.message)
          throw err
        }
      }
      // UIAA/Alpine validation.
      if (hasRegularDifficulty && !isFrench) {
        const gradeToCheck = difficultyGrade!
        if (!CLIMBING_UIAA_GRADES.includes(gradeToCheck as ClimbingUiaaGrade)) {
          throw new UnprocessableEntityException(
            `difficulty_grade "${gradeToCheck}" is not a valid UIAA/Alpine grade.`,
          )
        }
      }

      // Recalculate points.
      try {
        const raw = await this.scoring.calculateClimbingPoints({
          altitude: scoringAltitude,
          routeLength: scoringRouteLength,
          season,
          repetitionType,
          participantsNum,
          difficultyScale: difficultyScale ?? null,
          difficultyGrade: difficultyGrade ?? null,
          mappedGrade,
          mixedClimbing: mixedClimbing ?? null,
        })
        points = Math.round(raw * 100) / 100
      } catch (err) {
        if (err instanceof ScoringError) throw new UnprocessableEntityException(err.message)
        throw err
      }
    } else {
      // Personal: validate difficulty if present.
      if (hasRegularDifficulty) {
        if (!CLIMBING_DIFFICULTY_SCALES.includes(difficultyScale! as ClimbingDifficultyScale)) {
          throw new UnprocessableEntityException(
            `difficulty_scale "${difficultyScale}" is not valid. Allowed values: ${CLIMBING_DIFFICULTY_SCALES.join(', ')}.`,
          )
        }
        if (isFrench) {
          if (!CLIMBING_FRENCH_GRADES.includes(difficultyGrade! as ClimbingFrenchGrade)) {
            throw new UnprocessableEntityException(
              `difficulty_grade "${difficultyGrade}" is not a valid French grade.`,
            )
          }
        } else {
          if (!CLIMBING_UIAA_GRADES.includes(difficultyGrade! as ClimbingUiaaGrade)) {
            throw new UnprocessableEntityException(
              `difficulty_grade "${difficultyGrade}" is not a valid UIAA/Alpine grade.`,
            )
          }
        }
      }
      if (hasMixedDifficulty) {
        if (!CLIMBING_MIXED_GRADES.includes(mixedClimbing! as ClimbingMixedGrade)) {
          throw new UnprocessableEntityException(
            `mixed_climbing "${mixedClimbing}" is not valid. Allowed values: M1–M12, WI1–WI12.`,
          )
        }
      }
      if (completionType !== undefined && completionType !== null) {
        if (!CLIMBING_COMPLETION_TYPES.includes(completionType as ClimbingCompletionType)) {
          throw new UnprocessableEntityException(
            `completion_type "${completionType}" is not valid.`,
          )
        }
      }
      points = null
    }

    return this.prisma.activity.update({
      where: { id: existing.id },
      data: {
        date: dto.date ? new Date(dto.date) : existing.date,
        points: points !== null ? points : null,
        privateNotes: dto.privateNotes !== undefined ? dto.privateNotes : existing.privateNotes,
        publicNotes:  dto.publicNotes  !== undefined ? dto.publicNotes  : existing.publicNotes,
        climbingDetail: {
          update: {
            season,
            repetitionType,
            altitude: persistAltitude,
            routeLength: persistRouteLength,
            participantsNum,
            participantsText: participantsText ?? '',
            completionType:   completionType   ?? null,
            difficultyScale:  difficultyScale  ?? null,
            difficultyGrade:  difficultyGrade  ?? null,
            mappedScale:      mappedScale      ?? null,
            mappedGrade:      mappedGrade      ?? null,
            mixedClimbing:    mixedClimbing    ?? null,
          },
        },
      },
      include: { climbingDetail: true },
    })
  }

  /** Applies an expedition activity patch. Called only when existing.category === 'expedition'. */
  private async applyExpeditionPatch(
    existing: {
      id: string
      isOfficial: boolean
      points: any
      date: Date
      privateNotes: string | null
      publicNotes: string | null
      expeditionDetail: {
        country: string
        mountainRange: string
        mountain: string
        summit: string
        routeName: string
        season: string
        altitude: number
        totalElevationGain: number
        difficultyGrade: string
        participantsNum: number
        organizationType: string
      }
    },
    dto: PatchActivityDto,
  ) {
    const d = existing.expeditionDetail

    const country            = dto.country            ?? d.country
    const mountainRange      = dto.mountainRange      ?? d.mountainRange
    const mountain           = dto.mountain           ?? d.mountain
    const summit             = dto.summit             ?? d.summit
    const routeName          = dto.routeName          ?? d.routeName
    const season             = dto.season             ?? d.season
    const altitude           = dto.altitude           ?? d.altitude
    const totalElevationGain = dto.totalElevationGain ?? d.totalElevationGain
    const difficultyGrade    = dto.difficultyGrade    ?? d.difficultyGrade
    const participantsNum    = dto.participantsNum    ?? d.participantsNum
    const organizationType   = dto.organizationType   ?? d.organizationType

    // Always validate season and organizationType (same as create).
    if (!EXPEDITION_SEASONS.includes(season as ExpeditionSeason)) {
      throw new UnprocessableEntityException(
        `season "${season}" is not valid for expeditions. Allowed values: ${EXPEDITION_SEASONS.join(', ')}.`,
      )
    }
    if (!EXPEDITION_ORGANIZATION_TYPES.includes(organizationType as ExpeditionOrganizationType)) {
      throw new UnprocessableEntityException(
        `organization_type "${organizationType}" is not valid. Allowed values: ${EXPEDITION_ORGANIZATION_TYPES.join(', ')}.`,
      )
    }
    if (difficultyGrade && !EXPEDITION_DIFFICULTY_GRADES.includes(difficultyGrade as ExpeditionDifficultyGrade)) {
      throw new UnprocessableEntityException(
        `difficulty_grade "${difficultyGrade}" is not valid. Allowed values: ${EXPEDITION_DIFFICULTY_GRADES.join(', ')}.`,
      )
    }

    let points: number | null

    if (existing.isOfficial) {
      if (!difficultyGrade) {
        throw new UnprocessableEntityException('difficulty_grade is required for official expedition activities.')
      }
      if (!altitude || altitude <= 0) {
        throw new UnprocessableEntityException('altitude must be greater than 0 for official expedition activities.')
      }
      if (totalElevationGain === undefined || totalElevationGain <= 0) {
        throw new UnprocessableEntityException('total_elevation_gain must be greater than 0 for official expedition activities.')
      }

      try {
        const raw = this.scoring.calculateExpeditionPoints({
          altitude,
          totalElevationGain,
          season,
          difficultyGrade,
          participantsNum,
          organizationType,
        })
        points = Math.round(raw * 100) / 100
      } catch (err) {
        if (err instanceof ScoringError) throw new UnprocessableEntityException(err.message)
        throw err
      }
    } else {
      points = null
    }

    return this.prisma.activity.update({
      where: { id: existing.id },
      data: {
        date: dto.date ? new Date(dto.date) : existing.date,
        points: points !== null ? points : null,
        privateNotes: dto.privateNotes !== undefined ? dto.privateNotes : existing.privateNotes,
        publicNotes:  dto.publicNotes  !== undefined ? dto.publicNotes  : existing.publicNotes,
        expeditionDetail: {
          update: {
            country,
            mountainRange,
            mountain,
            summit,
            routeName,
            season,
            altitude,
            totalElevationGain,
            difficultyGrade,
            participantsNum,
            organizationType,
          },
        },
      },
      include: { expeditionDetail: true },
    })
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  /**
   * Hard-deletes an activity owned by the caller.
   *
   * Because the detail tables (hiking_activity_details etc.) use activity_id as FK
   * without ON DELETE CASCADE, the detail must be deleted first in a transaction.
   *
   * Returns 404 if the activity does not exist or belongs to a different user.
   * Returns { ok: true } on success.
   */
  async deleteActivity(id: string, callerUserId: string) {
    const existing = await this.prisma.activity.findUnique({
      where: { id },
      select: { id: true, userId: true, category: true },
    })

    if (!existing || existing.userId !== callerUserId) {
      throw new NotFoundException(`Activity with id ${id} not found`)
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete the category-specific detail row first (FK constraint).
      if (existing.category === 'hiking') {
        await tx.hikingActivityDetails.delete({ where: { activityId: id } })
      } else if (existing.category === 'climbing') {
        await tx.climbingActivityDetails.delete({ where: { activityId: id } })
      } else if (existing.category === 'expedition') {
        await tx.expeditionActivityDetails.delete({ where: { activityId: id } })
      }
      await tx.activity.delete({ where: { id } })
    })

    return { ok: true }
  }

  // ── Preview points (no DB writes) ───────────────────────────────────────────

  /**
   * Computes a live EOOA points preview for the given category payload.
   *
   * Returns { points, isReady: true } when the payload is complete and valid.
   * Returns { points: null, isReady: false } when the payload is incomplete.
   * Never throws for incomplete/expected-invalid data — that is normal for a
   * live preview called while the user is typing.
   */
  async previewPoints(dto: PreviewPointsDto): Promise<PreviewPointsResult> {
    if (dto.category === 'hiking') return this.previewHikingPoints(dto.payload)
    if (dto.category === 'climbing') return this.previewClimbingPoints(dto.payload)
    if (dto.category === 'expedition') return this.previewExpeditionPoints(dto.payload)
    return { points: null, isReady: false, reason: 'unknown_category' }
  }

  private previewHikingPoints(payload: Record<string, unknown>): PreviewPointsResult {
    const maxAltitude = Number(payload.maxAltitude) || 0
    const totalElevationGain = Number(payload.totalElevationGain) || 0
    const distanceRaw = Number(payload.distanceLength)
    const distanceLength =
      Number.isFinite(distanceRaw) && distanceRaw > 0 ? distanceRaw : 15
    const fieldType = String(payload.fieldType ?? '')
    const difficultyGrade = String(payload.difficultyGrade ?? '')
    const participantsNum = Number(payload.participantsNum) || 0

    if (
      maxAltitude <= 0 ||
      totalElevationGain <= 0 ||
      !HIKING_FIELD_TYPES.includes(fieldType as HikingFieldType) ||
      !HIKING_DIFFICULTY_GRADES.includes(difficultyGrade as HikingDifficultyGrade) ||
      participantsNum < 3
    ) {
      return { points: null, isReady: false, reason: 'missing_required_fields' }
    }

    try {
      const raw = this.scoring.calculateHikingPoints({
        maxAltitude,
        totalElevationGain,
        distanceLength,
        fieldType,
        difficultyGrade,
        participantsNum,
      })
      return { points: raw.toFixed(2), isReady: true }
    } catch {
      return { points: null, isReady: false, reason: 'scoring_error' }
    }
  }

  private async previewClimbingPoints(payload: Record<string, unknown>): Promise<PreviewPointsResult> {
    const altitudeRaw = Number(payload.altitude) || 0
    const routeLengthRaw = Number(payload.routeLength) || 0
    // Match createClimbing official defaults so preview works with empty optional fields.
    const altitude = altitudeRaw >= 1 ? altitudeRaw : 1000
    const routeLength = routeLengthRaw >= 0.01 ? routeLengthRaw : 100
    const season = String(payload.season ?? '')
    const repetitionType = String(payload.repetitionType ?? '')
    const participantsNum = Number(payload.participantsNum) || 0
    const difficultyScale = payload.difficultyScale ? String(payload.difficultyScale) : null
    const difficultyGrade = payload.difficultyGrade ? String(payload.difficultyGrade) : null
    const mixedClimbing = payload.mixedClimbing ? String(payload.mixedClimbing) : null

    if (
      !CLIMBING_SEASONS.includes(season as ClimbingSeason) ||
      !CLIMBING_REPETITION_TYPES.includes(repetitionType as ClimbingRepetitionType) ||
      participantsNum < 1
    ) {
      return { points: null, isReady: false, reason: 'missing_required_fields' }
    }

    const hasRegularDifficulty = !!(difficultyScale && difficultyGrade)
    const hasMixedDifficulty = !!mixedClimbing
    if (!hasRegularDifficulty && !hasMixedDifficulty) {
      return { points: null, isReady: false, reason: 'missing_required_fields' }
    }

    let mappedGrade: string | null = null
    if (difficultyScale === 'french' && difficultyGrade) {
      try {
        const resolved = await this.scoring.resolveClimbingGrade(difficultyGrade)
        mappedGrade = resolved.mappedGrade
      } catch {
        return { points: null, isReady: false, reason: 'french_grade_unmapped' }
      }
    }

    try {
      const raw = this.scoring.calculateClimbingPoints({
        altitude,
        routeLength,
        season,
        repetitionType,
        participantsNum,
        difficultyScale,
        difficultyGrade,
        mappedGrade,
        mixedClimbing,
      })
      return { points: raw.toFixed(2), isReady: true }
    } catch {
      return { points: null, isReady: false, reason: 'scoring_error' }
    }
  }

  private previewExpeditionPoints(payload: Record<string, unknown>): PreviewPointsResult {
    const altitude = Number(payload.altitude) || 0
    const totalElevationGain = Number(payload.totalElevationGain) || 0
    const season = String(payload.season ?? '')
    const difficultyGrade = String(payload.difficultyGrade ?? '')
    const participantsNum = Number(payload.participantsNum) || 0
    const organizationType = String(payload.organizationType ?? '')

    if (
      altitude <= 0 ||
      totalElevationGain <= 0 ||
      !EXPEDITION_SEASONS.includes(season as ExpeditionSeason) ||
      !EXPEDITION_DIFFICULTY_GRADES.includes(difficultyGrade as ExpeditionDifficultyGrade) ||
      participantsNum < 1 ||
      !EXPEDITION_ORGANIZATION_TYPES.includes(organizationType as ExpeditionOrganizationType)
    ) {
      return { points: null, isReady: false, reason: 'missing_required_fields' }
    }

    try {
      const raw = this.scoring.calculateExpeditionPoints({
        altitude,
        totalElevationGain,
        season,
        difficultyGrade,
        participantsNum,
        organizationType,
      })
      return { points: raw.toFixed(2), isReady: true }
    } catch {
      return { points: null, isReady: false, reason: 'scoring_error' }
    }
  }
}

