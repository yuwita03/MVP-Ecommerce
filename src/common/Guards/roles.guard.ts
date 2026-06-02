// common/guards/roles.guard.ts
import { CanActivate, ExecutionContext, HttpException, Injectable, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '../roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Ambil daftar roles dari decorator @Roles() di handler
    // Kalau tidak ada @Roles() → endpoint public, langsung return true
    const roles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());
    if (!roles) return true;

    // Ambil user dari request (diset oleh AuthMiddleware)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Kalau tidak ada user → belum login → 401
    if (!user) {
      this.logger.warn('Unauthorized access attempt');
      throw new HttpException('Unauthorized', 401);
    }

    // Kalau role user tidak ada di daftar roles yang diizinkan → 403
    if (!roles.includes(user.role as Role)) {
      this.logger.warn(
        `Forbidden: user ${user.username} dengan role ${user.role} mencoba akses resource yang dibatasi`
      );
      throw new HttpException('Forbidden', 403);
    }

    // Role sesuai → izinkan akses
    return true;
  }
}