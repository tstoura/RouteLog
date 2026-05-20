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
import { CreateHikingActivityDto } from './dto/create-hiking-activity.dto'

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
}
