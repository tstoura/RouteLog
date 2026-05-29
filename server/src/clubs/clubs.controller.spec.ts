import { ForbiddenException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ClubsController } from './clubs.controller'
import { ClubsService } from './clubs.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/auth.service'
import type { Request } from 'express'

/**
 * Unit tests for ClubsController authorisation logic.
 *
 * These tests call controller methods directly with a crafted `req` object,
 * bypassing the HTTP/guard pipeline in the same way the activity and export
 * service tests bypass the HTTP layer.
 *
 * Tests cover:
 *   POST /clubs
 *     - super_admin → allowed
 *     - user (normal member) → 403
 *     - any non-super_admin systemRole → 403
 *
 *   POST /clubs/:id/members
 *     - super_admin → allowed (skips isClubAdmin check)
 *     - club_admin of the target club → allowed
 *     - club_admin of a DIFFERENT club → 403
 *     - normal member → 403
 *
 * Note: 401 behaviour (missing / invalid Bearer token) is handled by
 * JwtAuthGuard and is already covered by auth.service.spec.ts.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(systemRole: string, sub = 'caller-uuid'): Request & { user: JwtPayload } {
  return {
    user: { sub, email: 'caller@example.com', systemRole },
  } as Request & { user: JwtPayload }
}

// ── Mock setup ────────────────────────────────────────────────────────────────

const mockClubsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  getMembershipsForClub: jest.fn(),
  getClubMembersForExport: jest.fn(),
  getClubOfficialActivities: jest.fn(),
  getMembershipsForUser: jest.fn(),
  getUserRoleInClub: jest.fn(),
  isClubAdmin: jest.fn(),
  createMembership: jest.fn(),
}

const MOCK_CLUB = { id: 'club-uuid', name: 'ΕΟΣ Πατρών' }
const MOCK_MEMBERSHIP = { userId: 'target-user', clubId: 'club-uuid', role: 'member' }
const CREATE_MEMBERSHIP_DTO = { userId: 'target-user', role: 'member' as const }

describe('ClubsController', () => {
  let controller: ClubsController

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClubsController],
      providers: [
        { provide: ClubsService, useValue: mockClubsService },
      ],
    })
      // Override JwtAuthGuard so the test module does not need AuthService.
      // The guard's 401 behaviour is covered by auth.service.spec.ts; these
      // tests focus on the 403 authorisation logic inside the controller.
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile()

    controller = module.get<ClubsController>(ClubsController)
  })

  // ── POST /clubs ─────────────────────────────────────────────────────────────

  describe('create (POST /clubs)', () => {
    it('super_admin can create a club', async () => {
      mockClubsService.create.mockResolvedValue(MOCK_CLUB)
      const req = makeReq('super_admin')
      const result = await controller.create({ name: 'ΕΟΣ Πατρών' }, req)
      expect(result).toEqual(MOCK_CLUB)
      expect(mockClubsService.create).toHaveBeenCalledWith({ name: 'ΕΟΣ Πατρών' })
    })

    it('normal user (systemRole = "user") → ForbiddenException (403)', async () => {
      const req = makeReq('user')
      await expect(controller.create({ name: 'Test' }, req)).rejects.toThrow(ForbiddenException)
      expect(mockClubsService.create).not.toHaveBeenCalled()
    })

    it('any non-super_admin systemRole → ForbiddenException (403)', async () => {
      // "club_admin" is a membership role, not a valid systemRole in practice,
      // but we verify the guard rejects any value that is not "super_admin".
      const req = makeReq('club_admin')
      await expect(controller.create({ name: 'Test' }, req)).rejects.toThrow(ForbiddenException)
      expect(mockClubsService.create).not.toHaveBeenCalled()
    })
  })

  // ── POST /clubs/:id/members ─────────────────────────────────────────────────

  describe('createMembership (POST /clubs/:id/members)', () => {
    it('super_admin can add a member (skips isClubAdmin check)', async () => {
      mockClubsService.createMembership.mockResolvedValue(MOCK_MEMBERSHIP)
      const req = makeReq('super_admin')
      const result = await controller.createMembership('club-uuid', CREATE_MEMBERSHIP_DTO, req)
      expect(result).toEqual(MOCK_MEMBERSHIP)
      expect(mockClubsService.isClubAdmin).not.toHaveBeenCalled()
      expect(mockClubsService.createMembership).toHaveBeenCalledWith('club-uuid', CREATE_MEMBERSHIP_DTO)
    })

    it('club_admin of the target club can add a member', async () => {
      mockClubsService.isClubAdmin.mockResolvedValue(true)
      mockClubsService.createMembership.mockResolvedValue(MOCK_MEMBERSHIP)
      const req = makeReq('user', 'admin-uuid')
      const result = await controller.createMembership('club-uuid', CREATE_MEMBERSHIP_DTO, req)
      expect(result).toEqual(MOCK_MEMBERSHIP)
      expect(mockClubsService.isClubAdmin).toHaveBeenCalledWith('admin-uuid', 'club-uuid')
    })

    it('club_admin of a DIFFERENT club → ForbiddenException (403)', async () => {
      // isClubAdmin returns false because this admin belongs to a different club.
      mockClubsService.isClubAdmin.mockResolvedValue(false)
      const req = makeReq('user', 'other-admin-uuid')
      await expect(
        controller.createMembership('club-uuid', CREATE_MEMBERSHIP_DTO, req),
      ).rejects.toThrow(ForbiddenException)
      expect(mockClubsService.createMembership).not.toHaveBeenCalled()
    })

    it('normal member → ForbiddenException (403)', async () => {
      mockClubsService.isClubAdmin.mockResolvedValue(false)
      const req = makeReq('user', 'member-uuid')
      await expect(
        controller.createMembership('club-uuid', CREATE_MEMBERSHIP_DTO, req),
      ).rejects.toThrow(ForbiddenException)
      expect(mockClubsService.createMembership).not.toHaveBeenCalled()
    })
  })
})
