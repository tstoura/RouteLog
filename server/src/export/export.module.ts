import { Module } from '@nestjs/common'

// Phase 9 will add: ExportController (POST /admin/clubs/:id/export),
// ExportService (query official activities, dispatch to Excel builders),
// ClubAdminGuard, and three Excel builder classes:
//   HikingExcelBuilder
//   ClimbingExcelBuilder
//   ExpeditionExcelBuilder
//
// Export rules (from docs/eooa-rules-alignment.md and docs/backend-decisions.md):
// - Only is_official = true activities are exported.
// - selectedUserIds are a temporary request input and are never persisted.
// - All column values are mapped to Greek uppercase EOOA labels at this layer only.
// - completion_type is never exported.
@Module({})
export class ExportModule {}
