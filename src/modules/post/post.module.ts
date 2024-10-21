import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { Post } from 'src/entities/post';
import { PostService } from './post.service';
import { Comment } from 'src/entities/comment';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Comment])],
  providers: [PostService],
  exports: [PostService],
  controllers: [PostController],
})
export class PostModule {}
