import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { ClubsModule } from '../clubs/clubs.module'

@Module({
  imports: [
    // JwtModule configured from env vars (JWT_SECRET, JWT_EXPIRES_IN).
    // ConfigModule is global, so ConfigService is available here.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Cast to 'any' because ConfigService returns plain string but
          // @nestjs/jwt expects the ms-compatible StringValue type.
          // The value is validated at runtime when the token is first signed.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as any,
        },
      }),
    }),
    // forwardRef(() => ClubsModule) breaks the circular dependency:
    //   AuthModule → ClubsModule (ClubsService for AuthService)
    //   ClubsModule → AuthModule (JwtAuthGuard for ClubsController)
    forwardRef(() => ClubsModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // JwtAuthGuard is provided here so it can inject AuthService.
    // Controllers apply it with @UseGuards(JwtAuthGuard).
    JwtAuthGuard,
  ],
  // Export AuthService and JwtAuthGuard so Phase 11C can reuse them
  // when applying auth guards to other modules.
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
