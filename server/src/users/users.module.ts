import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  // UsersService is exported so a future AuthModule can inject it
  // for credential verification via findByEmailWithPassword().
  exports: [UsersService],
})
export class UsersModule {}
