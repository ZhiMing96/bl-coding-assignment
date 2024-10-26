import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUserId } from '../auth/auth-user-id.decorator';
import { Comment } from 'src/entities/comment';
import { User } from 'src/entities/user';
import { Post as PostEntity } from 'src/entities/post';

export class CreatePostReqDto {
  caption: string;
}
export class CommentPostReqDto {
  comment: string;
}

export class GetPostsResDto {
  caption: string;
  comments: Comment[];
  imgUrl: string;
  id: number;
  createdBy: User;
  createdAt: Date;
  commentCount: number;
}

@Controller({ path: '/v1' })
@UseGuards(AuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('post')
  @UseInterceptors(FileInterceptor('image'))
  public async createPost(
    @AuthUserId() userId: number,
    @Body() req: CreatePostReqDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 104857600 }), // 100 MB = 100 * 1024 * 1024 = 104857600 bytes
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|bmp)$/i,
          }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ): Promise<PostEntity | null> {
    return this.postService.handleCreatePost(userId, req, file);
  }

  @Post('post/:postId/comment')
  public async comment(
    @AuthUserId() userId: number,
    @Body() req: CommentPostReqDto,
    @Param('postId') postId: number,
  ): Promise<Comment> {
    return this.postService.commentOnPost(userId, postId, req);
  }

  @Delete('post/:postId/comment/:commentId')
  public async deleteComment(
    @AuthUserId() userId: number,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
  ): Promise<void> {
    return this.postService.deleteComment(userId, postId, commentId);
  }

  @Get('posts')
  public async getPosts(
    @Query('offsetId') offsetId?: number,
  ): Promise<GetPostsResDto[]> {
    return this.postService.handleGetPostsPaginated(offsetId);
  }
}
