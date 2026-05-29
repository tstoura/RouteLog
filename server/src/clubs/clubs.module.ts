import { Module, forwardRef } from '@nestjs/common'
import { ClubsController } from './clubs.controller'
import { ClubsService } from './clubs.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  // forwardRef breaks the circular dependency:
  //   AuthModule → ClubsModule (ClubsService needed by AuthService)
  //   ClubsModule → AuthModule (JwtAuthGuard needed by ClubsController)
  imports: [forwardRef(() => AuthModule)],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
