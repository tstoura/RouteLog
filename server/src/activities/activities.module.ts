import { Module } from '@nestjs/common'
import { ActivitiesController } from './activities.controller'
import { ActivitiesService } from './activities.service'
import { ScoringModule } from '../scoring/scoring.module'
import { AuthModule } from '../auth/auth.module'

/** AuthModule is imported so ActivitiesController can use JwtAuthGuard. */
@Module({
  imports: [
    ScoringModule,
    AuthModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
