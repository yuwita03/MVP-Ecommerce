import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ValidationService } from 'src/common/validation.service';
import { PrismaService } from 'src/common/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
