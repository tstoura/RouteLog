import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import { ExportService } from './export.service'
import { ExportClubDto } from './dto/export-club.dto'

/**
 * Handles EOOA Excel export requests.
 *
 * All endpoints are currently unprotected for development.
 * TODO: add ClubAdminGuard / JwtAuthGuard once auth is implemented.
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
   * Returns an .xlsx file attachment using the EOOA official template.
   *
   * Body:
   * {
   *   "selectedUserIds": ["<uuid>", ...],
   *   "year": 2026,                      // optional
   *   "requesterUserId": "<uuid>"         // optional, temporary auth
   * }
   */
  @Post('club/:clubId')
  async exportClub(
    @Param('clubId', ParseUUIDPipe) clubId: string,
    @Body() dto: ExportClubDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.exportService.exportClub(clubId, dto)

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
