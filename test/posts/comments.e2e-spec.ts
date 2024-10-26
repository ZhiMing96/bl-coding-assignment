import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { createPost, seedAndLoginUser } from 'test/factory.e2e';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Post } from 'src/entities/post';

describe('Comments (e2e)', () => {
  let app: INestApplication,
    connection: DataSource,
    jwt: string,
    post: Post,
    userId: number;

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
    await connection.synchronize(true); // Resets the database schema and clears data
    const res = await createPost({ app });
    jwt = res.jwt;
    post = res.post;
    userId = res.userId;
  });

  describe('Create Comment (POST v1/post/:postId/comment)', () => {
    it('should be able to comment on own post', async () => {
      const mockComment = 'test-comment';
      const res = await request(app.getHttpServer())
        .post(`/v1/post/${post.id}/comment`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send({ comment: mockComment });

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.text).toEqual(mockComment);
      expect(parseInt(res.body.postId)).toEqual(post.id);
      expect(parseInt(res.body.createdById)).toEqual(userId);
    });

    it("should be able to comment on other's post", async () => {
      const mockComment = 'test-comment';
      const anotherUser = await seedAndLoginUser({ app });
      const anotherJwt = anotherUser.jwt;
      const anotherUserId = anotherUser.userId;
      const res = await request(app.getHttpServer())
        .post(`/v1/post/${post.id}/comment`)
        .set({ Authorization: `Bearer ${anotherJwt}` })
        .send({ comment: mockComment });

      expect(res.statusCode).toEqual(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.text).toEqual(mockComment);
      expect(parseInt(res.body.postId)).toEqual(post.id);
      expect(parseInt(res.body.createdById)).toEqual(anotherUserId);
    });
  });

  describe('Delete Comment (DELETE v1/post/:postId/comment/:commentId)', () => {
    let commentId: string;
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post(`/v1/post/${post.id}/comment`)
        .set({ Authorization: `Bearer ${jwt}` })
        .send({ comment: 'mockComment' });
      expect(res.statusCode).toBe(201);
      commentId = res.body.id;
    });

    it('should delete comment if it belongs to user', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/v1/post/${post.id}/comment/${commentId}`)
        .set({ Authorization: `Bearer ${jwt}` });

      expect(res.statusCode).toEqual(200);
    });

    it('should throw 401 if it does not belongs to user', async () => {
      const anotherUser = await seedAndLoginUser({ app });
      const anotherJwt = anotherUser.jwt;

      const res = await request(app.getHttpServer())
        .delete(`/v1/post/${post.id}/comment/${commentId}`)
        .set({ Authorization: `Bearer ${anotherJwt}` });

      expect(res.statusCode).toEqual(401);
    });
  });
});
