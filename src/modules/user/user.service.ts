import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user';
import { Repository } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { CreateUserReqDto } from './user.controller';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  public async getUserByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  public async getUserById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  public async createUser({
    username,
    password,
    firstName,
    lastName,
  }: CreateUserReqDto): Promise<User | null> {
    const duplicateUser = await this.getUserByUsername(username);
    if (duplicateUser) {
      throw new BadRequestException('Username in use');
    }
    const passwordHash = bcryptjs.hashSync(password, 10);

    return this.usersRepository.save(
      this.usersRepository.create({
        username,
        passwordHash,
        firstName,
        lastName,
      }),
    );
  }
}
