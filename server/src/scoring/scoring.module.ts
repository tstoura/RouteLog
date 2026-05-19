import { Module } from '@nestjs/common'

// Phase 6 will add: ScoringService with three pure calculation functions:
//   calculateHikingPoints(input)
//   calculateClimbingPoints(input)
//   calculateExpeditionPoints(input)
//
// All coefficient lookup tables will live in scoring/coefficients.ts.
// Scoring logic strictly follows docs/eooa-rules-alignment.md.
// ScoringModule is imported by ActivitiesModule to calculate points on submission.
@Module({})
export class ScoringModule {}
