import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'requiredPermission';

// Usage : @RequirePermission('rapports') sur un controller ou une méthode.
// Doit être combiné avec PermissionsGuard (voir permissions.guard.ts).
// Un ADMIN passe toujours, quelle que soit la permission demandée.
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
