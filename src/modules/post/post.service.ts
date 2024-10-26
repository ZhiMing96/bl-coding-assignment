import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as sharp from 'sharp';
import { Repository } from 'typeorm';
import { Post } from 'src/entities/post';
import {
  CommentPostReqDto,
  CreatePostReqDto,
  GetPostsResDto,
} from './post.controller';
import { Comment } from 'src/entities/comment';
import { POST_PAGINATION_SIZE } from './posts.const';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { orderBy } from 'lodash';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class PostService {
  private s3Client;

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      endpoint: process.env.AWS_ENDPOINT,
      forcePathStyle: true,
    });
  }

  public async getUserPostById(
    userId: number,
    postId: number,
  ): Promise<Post | null> {
    return this.postRepository.findOne({
      where: { createdById: userId, id: postId },
    });
  }

  public async handleCreatePost(
    userId: number,
    req: CreatePostReqDto,
    file?: Express.Multer.File,
  ): Promise<Post | null> {
    const newPost = await this.createPost(userId, req);
    if (!file) return newPost;
    const fileBuffer = file.buffer;
    const rawImgPath = `/${newPost.id}/raw/${file.originalname}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: rawImgPath,
        Body: fileBuffer,
      }),
    );
    await this.attachRawImagePath(newPost.id, rawImgPath);
    const resizedImageBuffer = await sharp(fileBuffer)
      .resize(600, 600)
      .toFormat('jpg')
      .toBuffer();
    const resizedImgPath = `/${newPost.id}/resized/${file.originalname}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: resizedImgPath,
        Body: resizedImageBuffer,
      }),
    );
    await this.attachResizedImagePath(newPost.id, resizedImgPath);
    return this.getUserPostById(userId, newPost.id);
  }

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

  public async attachRawImagePath(
    postId: number,
    rawImgPath: string,
  ): Promise<void> {
    await this.postRepository.update(
      {
        id: postId,
      },
      {
        rawImgFilePath: rawImgPath,
      },
    );
  }

  public async attachResizedImagePath(
    postId: number,
    resizedImgPath: string,
  ): Promise<void> {
    await this.postRepository.update(
      {
        id: postId,
      },
      {
        processedImgFilePath: resizedImgPath,
      },
    );
  }

  public async commentOnPost(
    createdById: number,
    postId: number,
    { comment }: CommentPostReqDto,
  ): Promise<Comment> {
    const newComment = await this.commentRepository.save(
      this.commentRepository.create({
        text: comment,
        postId,
        createdById,
      }),
    );
    await this.postRepository.update(
      { id: postId },
      {
        commentCount: () => 'commentCount + 1',
      },
    );
    return newComment;
  }

  public async deleteComment(
    userId: number,
    postId: number,
    commentId: number,
  ): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, postId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.createdById !== userId) {
      throw new UnauthorizedException('Not authorized to perform deletion');
    }

    await this.commentRepository.delete({
      id: commentId,
    });
    await this.postRepository.update(
      { id: postId },
      {
        commentCount: () => 'commentCount - 1',
      },
    );
  }

  public async handleGetPostsPaginated(
    offsetId?: number,
  ): Promise<GetPostsResDto[]> {
    const posts = await this.getPosts(offsetId);
    const orderedPosts = orderBy(posts, 'commentCount', 'desc');
    return await Promise.all(
      orderedPosts.map(async (post) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: post.processedImgFilePath,
        });
        const url = await getSignedUrl(this.s3Client, command, {
          expiresIn: 3600, // expires in 1 hour
        });

        const sortedComments = orderBy(
          post.comments ?? [],
          'createdAt',
          'desc',
        );

        return {
          caption: post.caption,
          comments: sortedComments.slice(0, 2),
          imgUrl: url,
          id: post.id,
          createdBy: post.createdBy,
          createdAt: post.createdAt,
          commentCount: post.commentCount,
        };
      }),
    );
  }

  public async getPosts(offsetId?: number): Promise<Post[] | null> {
    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.comments', 'comment');

    if (offsetId) {
      query.where('post.id > :offsetId', { offsetId });
    }

    query.orderBy('post.id', 'ASC').limit(POST_PAGINATION_SIZE);
    return query.getMany();
  }
}
