import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const AuthUserId = createParamDecorator(
  (_, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = request?.user;
    if (!user) throw new UnauthorizedException();
    return user.sub;
  },
);
