import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { Comment } from 'src/entities/comment';
import { Post } from 'src/entities/post';
import { CommentPostReqDto } from 'src/modules/post/post.controller';
import { CreateUserReqDto } from 'src/modules/user/user.controller';

import * as request from 'supertest';

export const seedAndLoginUser = async (params: {
  app: INestApplication;
  username?: string;
  password?: string;
}) => {
  const { app } = params;
  const { id, username, password } = await seedUser(params);
  const { jwt } = await loginUser({ app, username, password });
  return { userId: id, username, password, jwt };
};

export const seedUser = async (params: {
  app: INestApplication;
  requestOverrides?: Partial<CreateUserReqDto>;
}) => {
  const { app, requestOverrides = {} } = params;
  let { username, password } = requestOverrides;
  const uuid = randomUUID();
  username = username ?? `mock-username-${uuid}`;
  password = password ?? `mock-password-${uuid}`;

  const userRes = await request(app.getHttpServer())
    .post('/v1/user')
    .send({
      username,
      password,
      firstName: 'mock',
      lastName: 'user',
      ...requestOverrides,
    });
  expect(userRes.statusCode).toBe(201);

  return { id: userRes.body.id, username, password };
};

const loginUser = async (params: {
  app: INestApplication;
  username: string;
  password: string;
}) => {
  const { app, username, password } = params;
  const loginRes = await request(app.getHttpServer())
    .post('/v1/auth/login')
    .send({
      username,
      password,
    });
  expect(loginRes.statusCode).toBe(201);
  expect(loginRes.body.access_token).toBeDefined();

  return { jwt: loginRes.body.access_token };
};

export const createPost = async (params: {
  app: INestApplication;
  jwt?: string;
  username?: string;
  password?: string;
}): Promise<{ post: Post; jwt: string; userId?: number }> => {
  const { app, username, password } = params;
  let { jwt } = params;
  const filePath = path.join(__dirname, `./images/bandlab.jpg`);
  let userId;

  if (!jwt) {
    if (username && password) {
      const loginRes = await loginUser({ app, username, password });
      jwt = loginRes.jwt;
    } else {
      const loginRes = await seedAndLoginUser({ app });
      jwt = loginRes.jwt;
      userId = loginRes.userId;
    }
  }

  const res = await request(app.getHttpServer())
    .post('/v1/post')
    .set({ Authorization: `Bearer ${jwt}` })
    .attach('image', filePath);

  expect(res.statusCode).toBe(201);
  return { post: res.body, jwt, userId };
};

export const commentOnPost = async (params: {
  app: INestApplication;
  postId: number;
  jwt: string;
  reqOverrides?: Partial<CommentPostReqDto>;
}): Promise<Comment> => {
  const { app, postId, jwt, reqOverrides = {} } = params;
  const res = await request(app.getHttpServer())
    .post(`/v1/post/${postId}/comment`)
    .set({ Authorization: `Bearer ${jwt}` })
    .send({ caption: 'mockCaption', ...reqOverrides });
  expect(res.statusCode).toEqual(201);
  return res.body;
};

export const deleteComment = async (params: {
  app: INestApplication;
  postId: number;
  jwt: string;
  commentId: number;
}) => {
  const { app, postId, jwt, commentId } = params;
  await request(app.getHttpServer())
    .delete(`/v1/post/${postId}/comment/${commentId}`)
    .set({ Authorization: `Bearer ${jwt}` })
    .expect(200);
};
