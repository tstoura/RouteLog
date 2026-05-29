import { Module } from '@nestjs/common'
import { ClimbingRoutesController } from './climbing-routes.controller'
import { ClimbingRoutesService } from './climbing-routes.service'

@Module({
  controllers: [ClimbingRoutesController],
  providers: [ClimbingRoutesService],
  // ClimbingRoutesService is exported so ActivitiesModule (Phase 7B) can
  // fetch a route by id and snapshot its identity fields into climbing_activity_details.
  exports: [ClimbingRoutesService],
})
export class ClimbingRoutesModule {}
