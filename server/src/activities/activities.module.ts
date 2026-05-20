import { Module } from '@nestjs/common'
import { ActivitiesController } from './activities.controller'
import { ActivitiesService } from './activities.service'
import { ScoringModule } from '../scoring/scoring.module'

// Phase 7B will add climbing activity creation.
// Phase 7C will add expedition activity creation.
// Phase 8  will add activity retrieval/history endpoints.
//
// All three categories share a common activities table (base) plus one
// category-specific detail table per activity record. Submissions use a
// single Prisma nested write (implicit transaction) to insert both rows.
@Module({
  imports: [
    // ScoringModule provides ScoringService for point calculation on submission.
    ScoringModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
