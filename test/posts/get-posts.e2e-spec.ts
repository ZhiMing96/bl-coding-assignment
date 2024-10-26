import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import {
  commentOnPost,
  createPost,
  deleteComment,
  seedAndLoginUser,
} from 'test/factory.e2e';

describe('Get Post (e2e Test)', () => {
  let app: INestApplication, connection: DataSource, jwt: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = app.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    await connection.synchronize(true); // Resets the database schema and clears data
    await connection.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await connection.synchronize(true);
    const loginRes = await seedAndLoginUser({ app });
    jwt = loginRes.jwt;
  });

  describe('when offset is not provided', () => {
    let firstPostId: number, secondPostId: number;
    beforeEach(async () => {
      const { post: firstPost } = await createPost({ app, jwt });
      firstPostId = firstPost.id;
      await commentOnPost({
        app,
        postId: firstPostId,
        jwt,
        reqOverrides: { comment: 'comment-1' },
      });

      const { post: secondPost } = await createPost({ app, jwt });
      secondPostId = secondPost.id;
      const { id: commentId } = await commentOnPost({
        app,
        postId: secondPostId,
        jwt,
        reqOverrides: { comment: 'comment-1' },
      });
      await deleteComment({
        app,
        postId: secondPost.id,
        jwt,
        commentId,
      });
    });

    it('should fetch and return posts sorted by comment count.', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/posts')
        .set({ Authorization: `Bearer ${jwt}` });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toEqual(firstPostId);
      expect(res.body[0].commentCount).toEqual(1);
      expect(res.body[1].id).toEqual(secondPostId);
      expect(res.body[1].commentCount).toEqual(0);
    });

    it('should fetch at most two comments, sorted by creation date', async () => {
      for (let i = 2; i < 6; i++) {
        await commentOnPost({
          app,
          postId: secondPostId,
          jwt,
          reqOverrides: { comment: `comment-${i}` },
        });
      }

      const res = await request(app.getHttpServer())
        .get('/v1/posts')
        .set({ Authorization: `Bearer ${jwt}` });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toEqual(secondPostId);
      expect(res.body[1].id).toEqual(firstPostId);
      expect(res.body[0].commentCount).toEqual(4);
      expect(res.body[0].comments).toHaveLength(2);
      expect(res.body[0].comments[0].text).toEqual('comment-5');
      expect(res.body[0].comments[1].text).toEqual('comment-4');
    });
  });
  describe('when offset is provided', () => {
    const posts = [];
    beforeEach(async () => {
      for (let i = 1; i < 6; i++) {
        const { post } = await createPost({ app, jwt });
        posts.push(post);
      }
    });

    it('should only return posts that has id more than offsetId', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/posts')
        .set({ Authorization: `Bearer ${jwt}` })
        .query({ offsetId: 3 });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toEqual(4);
      expect(res.body[1].id).toEqual(5);
    });
  });
});
