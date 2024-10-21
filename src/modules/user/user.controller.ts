import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/entities/user';

export class LoginReqDto {
  username: string;
  password: string;
}

export class CreateUserReqDto {
  username: string;
  password: string;
  firstName: string;
  lastName?: string;
}

@Controller({ path: 'v1/user' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  public async createUser(@Body() req: CreateUserReqDto): Promise<User | null> {
    return this.userService.createUser(req);
  }
}
