import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'
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
 * Authorization (Phase 11D):
 *   - JWT Bearer token required.
 *   - Only club_admin for that club or super_admin may request an export.
 *   - Enforced via JwtAuthGuard + ExportService.assertRequesterIsAuthorized().
 *   - requesterUserId from request body is IGNORED; identity comes from JWT.
 */
@Module({
  imports: [
    PrismaModule,
    // AuthModule provides JwtAuthGuard (and AuthService for token verification)
    // so ExportController can protect the export endpoint.
    AuthModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
