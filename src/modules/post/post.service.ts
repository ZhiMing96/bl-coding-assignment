import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { Post } from 'src/entities/post';
import { CommentPostReqDto, CreatePostReqDto } from './post.controller';
import { Comment } from 'src/entities/comment';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  public async createPost(
    createdById: number,
    { caption }: CreatePostReqDto,
  ): Promise<Post | null> {
    return this.postRepository.save(
      this.postRepository.create({
        createdById,
        caption,
      }),
    );
  }

  public async attachRawImagePath(postId: number, rawImgPath: string) {
    await this.postRepository.update(
      {
        id: postId,
      },
      {
        rawImgFilePath: rawImgPath,
      },
    );
  }

  public async commentOnPost(
    createdById: number,
    postId: number,
    { comment }: CommentPostReqDto,
  ) {
    return this.commentRepository.save(
      this.commentRepository.create({
        text: comment,
        postId,
        createdById,
      }),
    );
  }

  public async getPosts(): Promise<Post[] | null> {
    return this.postRepository.find({});
  }
}
