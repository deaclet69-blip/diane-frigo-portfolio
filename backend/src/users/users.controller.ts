import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PERMISSION_KEYS } from './permissions';

const ROLE_NAMES = ['ADMIN', 'RESPONSABLE', 'VENDEUR', 'MAGASINIER'] as const;

class CreateUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsIn(ROLE_NAMES)
  roleName!: (typeof ROLE_NAMES)[number];

  // Pages auxquelles ce nouvel utilisateur aura accès (ignoré si ADMIN).
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_KEYS, { each: true })
  permissions?: string[];
}

class SetActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

class ChangeRoleDto {
  @IsIn(ROLE_NAMES)
  roleName!: (typeof ROLE_NAMES)[number];
}

class ChangePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_KEYS, { each: true })
  permissions!: string[];
}

// Paramètres > Utilisateurs : réservé ADMIN (matrice §7)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: { id: string }) {
    return this.usersService.create(dto, user.id);
  }

  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body() dto: SetActiveDto, @CurrentUser() user: { id: string }) {
    return this.usersService.setActive(id, dto.isActive, user.id);
  }

  @Patch(':id/role')
  changeRole(@Param('id') id: string, @Body() dto: ChangeRoleDto, @CurrentUser() user: { id: string }) {
    return this.usersService.changeRole(id, dto.roleName, user.id);
  }

  @Patch(':id/permissions')
  changePermissions(@Param('id') id: string, @Body() dto: ChangePermissionsDto, @CurrentUser() user: { id: string }) {
    return this.usersService.changePermissions(id, dto.permissions, user.id);
  }
}
