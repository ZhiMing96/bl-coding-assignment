import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginReqDto } from './auth.controller';
import { UserService } from '../user/user.service';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UserService,
  ) {}

  async login({ username, password }: LoginReqDto) {
    const user = await this.usersService.getUserByUsername(username);
    if (
      !user.passwordHash ||
      !(await bcryptjs.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
