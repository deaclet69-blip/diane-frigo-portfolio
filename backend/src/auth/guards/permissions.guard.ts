import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

// Vérifie que l'utilisateur a la permission demandée (correspond aux cases à
// cocher de Paramètres > Utilisateurs, cf. backend/src/users/permissions.ts
// et frontend/src/constants/permissions.ts — mêmes clés des deux côtés).
// L'ADMIN a toujours accès à tout, quelles que soient les permissions stockées
// (même règle que côté frontend, voir hasPermission()).
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true; // pas de permission requise sur cette route
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return Array.isArray(user.permissions) && user.permissions.includes(requiredPermission);
  }
}
