import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage : findAll(@CurrentUser() user: AuthenticatedUser)
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
