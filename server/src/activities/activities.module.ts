import { Module } from '@nestjs/common'
import { ActivitiesController } from './activities.controller'
import { ActivitiesService } from './activities.service'
import { ScoringModule } from '../scoring/scoring.module'
import { AuthModule } from '../auth/auth.module'

/**
 * Phase 11C: AuthModule is imported so ActivitiesController can use
 * JwtAuthGuard (exported from AuthModule) to protect all activity endpoints.
 */
@Module({
  imports: [
    ScoringModule,
    AuthModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
