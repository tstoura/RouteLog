import { Module } from '@nestjs/common'
import { ClubsController } from './clubs.controller'
import { ClubsService } from './clubs.service'

@Module({
  controllers: [ClubsController],
  providers: [ClubsService],
  // ClubsService is exported so ActivitiesModule can:
  //   - validate that the submitted club_id belongs to the submitting user
  //   - check isClubAdmin() when triggering exports
  exports: [ClubsService],
})
export class ClubsModule {}
