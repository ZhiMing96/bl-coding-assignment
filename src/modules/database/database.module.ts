import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user';
import { Post } from 'src/entities/post';
import { Comment } from 'src/entities/comment';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        return {
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          entities: [User, Post, Comment],
          synchronize: true,
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
