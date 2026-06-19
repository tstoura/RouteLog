import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { USER_PUBLIC_SELECT } from './users.constants'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns all users without password_hash. Restricted to super_admin in the controller. */
  findAll() {
    return this.prisma.user.findMany({
      select: USER_PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    })
  }

  async findByIdOrThrow(id: string) {
    const user = await this.findById(id)
    if (!user) throw new NotFoundException(`User with id ${id} not found`)
    return user
  }

  /**
   * Used by AuthService to verify credentials.
   * Returns the full record including passwordHash — never forward to a response.
   */
  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    await this.findByIdOrThrow(id)
    return this.prisma.user.update({
      where: { id },
      // Prisma ignores undefined properties, so only explicitly provided fields are updated.
      data: dto,
      select: USER_PUBLIC_SELECT,
    })
  }

  /**
   * Returns all club memberships (with club info) for a given user.
   * An empty array means the user is independent (no club).
   */
  getMemberships(userId: string) {
    return this.prisma.clubMembership.findMany({
      where: { userId },
      include: { club: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Returns true when the user has NO club_membership rows.
   * Source: docs/backend-decisions.md §2
   */
  async isIndependentUser(userId: string): Promise<boolean> {
    const count = await this.prisma.clubMembership.count({ where: { userId } })
    return count === 0
  }
}
