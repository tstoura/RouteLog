import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateRouteDto } from './dto/create-route.dto'
import { SearchRoutesDto } from './dto/search-routes.dto'
import { normalizeName } from './climbing-routes.constants'

@Injectable()
export class ClimbingRoutesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Read ──────────────────────────────────────────────────────────────────

  findById(id: string) {
    return this.prisma.route.findUnique({ where: { id } })
  }

  async findByIdOrThrow(id: string) {
    const route = await this.findById(id)
    if (!route) throw new NotFoundException(`Route with id ${id} not found`)
    return route
  }

  /**
   * Search / list routes.
   *
   * All filters are optional and can be combined:
   *   q             — partial case-insensitive match on routes.name
   *   mountainOrArea — partial case-insensitive match
   *   climbingField  — partial case-insensitive match
   *   category       — exact match (defaults to "climbing")
   */
  search(dto: SearchRoutesDto) {
    const {
      q,
      mountainOrArea,
      climbingField,
      category = 'climbing',
      take = 20,
      skip = 0,
    } = dto

    return this.prisma.route.findMany({
      where: {
        category,
        ...(q && {
          name: { contains: q, mode: 'insensitive' },
        }),
        ...(mountainOrArea && {
          mountainOrArea: { contains: mountainOrArea, mode: 'insensitive' },
        }),
        ...(climbingField && {
          climbingField: { contains: climbingField, mode: 'insensitive' },
        }),
      },
      orderBy: [{ mountainOrArea: 'asc' }, { name: 'asc' }],
      take,
      skip,
    })
  }

  /**
   * Returns public activity reviews for a route — climbing activities linked to
   * this route where publicNotes is non-empty.
   * privateNotes are never exposed here.
   */
  getActivityReviews(routeId: string) {
    return this.prisma.activity.findMany({
      where: {
        climbingDetail: { routeId },
        publicNotes: { not: null },
        NOT: { publicNotes: '' },
      },
      select: {
        id: true,
        date: true,
        publicNotes: true,
        climbingDetail: {
          select: {
            completionType: true,
            difficultyGrade: true,
            mappedGrade: true,
            mixedClimbing: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })
  }

  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * Creates a new climbing route.
   *
   * Duplicate prevention (docs/backend-decisions.md §13):
   *   An exact duplicate is defined as an existing route with the same:
   *     normalized_name + mountain_or_area + climbing_field
   *   The check is case-insensitive for mountain_or_area and climbing_field.
   *
   *   If a duplicate is found:
   *     → 409 Conflict with the existing route embedded in the response.
   *
   *   The DB also has a @@unique([normalizedName, mountainOrArea, climbingField])
   *   constraint as a safety net for exact case-sensitive matches.
   *
   *   TODO (future phase): add fuzzy/similar-name detection and surface as a
   *   warning/suggestion without blocking creation.
   */
  async create(dto: CreateRouteDto, userId: string) {
    const normalizedName = normalizeName(dto.name)
    const trimmedArea = dto.mountainOrArea.trim()
    const trimmedField = dto.climbingField.trim()

    // Service-layer duplicate check (case-insensitive on area + field).
    const existing = await this.prisma.route.findFirst({
      where: {
        normalizedName,
        mountainOrArea: { equals: trimmedArea, mode: 'insensitive' },
        climbingField: { equals: trimmedField, mode: 'insensitive' },
      },
    })

    if (existing) {
      throw new ConflictException({
        message: 'A route with this name, mountain/area, and climbing field already exists.',
        existingRoute: {
          id: existing.id,
          name: existing.name,
          mountainOrArea: existing.mountainOrArea,
          climbingField: existing.climbingField,
          defaultScale: existing.defaultScale,
          defaultGrade: existing.defaultGrade,
          altitude: existing.altitude,
          routeLength: existing.routeLength,
        },
      })
    }

    return this.prisma.route.create({
      data: {
        name: dto.name.trim(),
        normalizedName,
        mountainOrArea: trimmedArea,
        climbingField: trimmedField,
        defaultScale: dto.defaultScale,
        defaultGrade: dto.defaultGrade,
        altitude: dto.altitude ?? null,
        routeLength: dto.routeLength ?? null,
        category: dto.category ?? 'climbing',
        createdByUserId: userId,
      },
    })
  }
}
