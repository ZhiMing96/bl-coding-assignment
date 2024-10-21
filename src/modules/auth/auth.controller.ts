import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

export class LoginReqDto {
  username: string;
  password: string;
}

@Controller({ path: 'v1/auth' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  public async login(@Body() req: LoginReqDto) {
    return this.authService.login(req);
  }
}
