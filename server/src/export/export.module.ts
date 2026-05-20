import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ExportController } from './export.controller'
import { ExportService } from './export.service'

/**
 * Phase 9 — Admin export module.
 *
 * Provides POST /export/club/:clubId which streams an EOOA-compatible .xlsx
 * file for a club's official activities.
 *
 * Export rules:
 *   - Only is_official = true activities are included.
 *   - selectedUserIds are a request-time filter, never persisted.
 *   - All column values are mapped to Greek uppercase EOOA labels at this layer only.
 *   - completion_type is never exported.
 *
 * Authorization:
 *   - Only club_admin for that club or super_admin may request an export.
 *   - Currently enforced via requesterUserId in the request body (temporary).
 *   - TODO: replace with ClubAdminGuard once JWT auth is implemented.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
