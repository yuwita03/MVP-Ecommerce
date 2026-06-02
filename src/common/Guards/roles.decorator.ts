// common/guards/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../roles.enum';

// Key untuk menyimpan metadata roles
export const ROLES_KEY = 'roles';

// Decorator @Roles() yang dipakai di controller
// Contoh: @Roles(Role.ADMIN) atau @Roles(Role.ADMIN, Role.USER)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);