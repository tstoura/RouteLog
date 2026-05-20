import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateClubDto } from './dto/create-club.dto'
import { CreateMembershipDto } from './dto/create-membership.dto'

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Clubs ─────────────────────────────────────────────────────────────────

  create(dto: CreateClubDto) {
    return this.prisma.club.create({ data: dto })
  }

  findAll() {
    return this.prisma.club.findMany({ orderBy: { name: 'asc' } })
  }

  findById(id: string) {
    return this.prisma.club.findUnique({ where: { id } })
  }

  async findByIdOrThrow(id: string) {
    const club = await this.findById(id)
    if (!club) throw new NotFoundException(`Club with id ${id} not found`)
    return club
  }

  // ── Memberships ───────────────────────────────────────────────────────────

  /**
   * Adds a user to a club.
   *
   * Business rules (docs/backend-decisions.md §2):
   *   - A user can belong to more than one club.
   *   - A user already in this club gets a 409 Conflict.
   *   - The role is club-scoped only; it does not change system_role.
   *
   * The DB-level @@unique([userId, clubId]) constraint (added in Phase 4) enforces
   * uniqueness at the database level. The findFirst check below returns a cleaner
   * 409 error message before the DB constraint would fire.
   */
  async createMembership(clubId: string, dto: CreateMembershipDto) {
    await this.findByIdOrThrow(clubId)

    const existing = await this.prisma.clubMembership.findFirst({
      where: { userId: dto.userId, clubId },
    })
    if (existing) {
      throw new ConflictException(
        `User ${dto.userId} is already a member of club ${clubId}`,
      )
    }

    return this.prisma.clubMembership.create({
      data: {
        userId: dto.userId,
        clubId,
        role: dto.role,
        registryNumber: dto.registryNumber,
      },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    })
  }

  /** All memberships for a club, with basic user info. */
  getMembershipsForClub(clubId: string) {
    return this.prisma.clubMembership.findMany({
      where: { clubId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /** All memberships for a user — used by ActivitiesService to validate club_id. */
  getMembershipsForUser(userId: string) {
    return this.prisma.clubMembership.findMany({
      where: { userId },
      include: { club: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Returns the user's role in a specific club, or null if not a member.
   * Used by auth guards (Phase 5) to check club_admin access.
   */
  async getUserRoleInClub(userId: string, clubId: string): Promise<string | null> {
    const membership = await this.prisma.clubMembership.findFirst({
      where: { userId, clubId },
    })
    return membership?.role ?? null
  }

  /**
   * Returns true when the user has role = 'club_admin' in the given club.
   * Club admin can trigger exports and view all official activities for their club.
   */
  async isClubAdmin(userId: string, clubId: string): Promise<boolean> {
    const role = await this.getUserRoleInClub(userId, clubId)
    return role === 'club_admin'
  }
}
