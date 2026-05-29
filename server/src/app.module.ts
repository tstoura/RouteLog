import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ClubsModule } from './clubs/clubs.module'
import { ActivitiesModule } from './activities/activities.module'
import { ClimbingRoutesModule } from './climbing-routes/climbing-routes.module'
import { ScoringModule } from './scoring/scoring.module'
import { ExportModule } from './export/export.module'

@Module({
  imports: [
    // Loads .env automatically; available globally via ConfigService.
    ConfigModule.forRoot({ isGlobal: true }),

    // PrismaModule is @Global so every module can inject PrismaService
    // without re-importing PrismaModule.
    PrismaModule,

    HealthModule,
    AuthModule,
    UsersModule,
    ClubsModule,
    ActivitiesModule,
    ClimbingRoutesModule,
    ScoringModule,
    ExportModule,
  ],
})
export class AppModule {}
