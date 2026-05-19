import { Module } from '@nestjs/common'

// Phase 7A will add hiking activity creation.
// Phase 7B will add climbing activity creation.
// Phase 7C will add expedition activity creation.
// Phase 8  will add activity retrieval/history endpoints.
//
// All three categories share a common activities table (base) plus one
// category-specific detail table per activity record. Submissions use a
// single Prisma transaction to insert both rows atomically.
@Module({})
export class ActivitiesModule {}
