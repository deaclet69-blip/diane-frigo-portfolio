import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Usage : @Roles('ADMIN', 'RESPONSABLE') sur un controller ou une méthode.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
