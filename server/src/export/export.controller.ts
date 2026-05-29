import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Request as ExpressRequest, Response } from 'express'
import { ExportService } from './export.service'
import { ExportClubDto } from './dto/export-club.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { JwtPayload } from '../auth/auth.service'

type AuthRequest = ExpressRequest & { user: JwtPayload }

/**
 * Handles EOOA Excel export requests.
 *
 * Phase 11D: POST /export/club/:clubId is now protected by JwtAuthGuard.
 *   - Requester identity comes from req.user.sub (JWT), not from the request body.
 *   - dto.requesterUserId is accepted for backward compatibility but is IGNORED.
 *   - Authorization is enforced in ExportService:
 *       super_admin or club_admin of the requested club → allowed
 *       anything else → 403 Forbidden
 */
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  /**
   * POST /export/club/:clubId
   *
   * Exports official activities for the specified club, filtered by
   * selectedUserIds and an optional year.
   *
   * Requires: Authorization: Bearer <token>
   *   Token must belong to super_admin OR club_admin of the target club.
   *
   * Returns an .xlsx file attachment using the EOOA official template.
   *
   * Body:
   * {
   *   "selectedUserIds": ["<uuid>", ...],  // required — filter for the export
   *   "year": 2026,                        // optional year filter
   *   "requesterUserId": "<uuid>"          // ignored — backward compat only
   * }
   *
   * Returns 401 if not authenticated.
   * Returns 403 if authenticated but not super_admin or club_admin of this club.
   * Returns 404 if the club does not exist.
   */
  @Post('club/:clubId')
  @UseGuards(JwtAuthGuard)
  async exportClub(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body() dto: ExportClubDto,
    @Res() res: Response,
    @Request() req: AuthRequest,
  ): Promise<void> {
    const buffer = await this.exportService.exportClub(clubId, dto, req.user.sub)

    const filename = `eooa-export-${clubId}.xlsx`

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    })
    res.end(buffer)
  }
}
