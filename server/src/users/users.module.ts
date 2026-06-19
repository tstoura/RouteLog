import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  // UsersService is exported so AuthModule can inject it
  // for credential verification via findByEmailWithPassword().
  exports: [UsersService],
})
export class UsersModule {}
