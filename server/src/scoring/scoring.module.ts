import { Module } from '@nestjs/common'
import { ScoringService } from './scoring.service'

@Module({
  providers: [ScoringService],
  // Exported so ActivitiesModule (Phase 7) can inject ScoringService to
  // calculate points at activity submission time.
  exports: [ScoringService],
})
export class ScoringModule {}
