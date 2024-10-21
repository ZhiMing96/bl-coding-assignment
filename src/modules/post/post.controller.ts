import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUserId } from '../auth/auth-user-id.decorator';

export class CreatePostReqDto {
  caption: string;
}
export class CommentPostReqDto {
  comment: string;
}

@Controller({ path: '/v1' })
@UseGuards(AuthGuard)
export class PostController {
  private s3Client;
  constructor(
    private readonly postService: PostService,
    private readonly configService: ConfigService,
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

  @Post('post')
  @UseInterceptors(FileInterceptor('image'))
  public async createPost(
    @AuthUserId() userId: number,
    @Body() req: CreatePostReqDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const newPost = await this.postService.createPost(userId, req);
    const rawImgPath = `${newPost.id}/raw/${file.originalname}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: rawImgPath,
        Body: file.buffer,
      }),
    );
    await this.postService.attachRawImagePath(newPost.id, rawImgPath);

    return;
  }

  @Post('post/:postId/comment')
  public async comment(
    @AuthUserId() userId: number,
    @Body() req: CommentPostReqDto,
    @Param('postId') postId: number,
  ) {
    return this.postService.commentOnPost(userId, postId, req);
  }

  @Get('posts')
  public async getPosts() {
    const posts = await this.postService.getPosts();
    return await Promise.all(
      posts.map(async (post) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: post.rawImgFilePath,
        });
        const url = await getSignedUrl(this.s3Client, command, {
          expiresIn: 3600,
        }); // URL expires in 1 hour

        return {
          caption: post.caption,
          comments: post.comments?.slice(0, 2),
          imgUrl: url,
          id: post.id,
          createdBy: post.createdBy,
          createdAt: post.createdAt,
        };
      }),
    );
  }
}
