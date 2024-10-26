import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as path from 'path';

import { INestApplication } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { seedAndLoginUser } from 'test/factory.e2e';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('Create Post (e2e)', () => {
  let app: INestApplication,
    connection: DataSource,
    jwt: string,
    userId: number;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = app.get<DataSource>(getDataSourceToken());
  });

  beforeEach(async () => {
    await connection.synchronize(true); // Resets the database schema and clears data
    const res = await seedAndLoginUser({ app });
    jwt = res.jwt;
    userId = res.userId;
  });

  afterAll(async () => {
    await connection.synchronize(true); // Resets the database schema and clears data
    await connection.destroy();
    await app.close();
  });

  describe('POST /v1/post', () => {
    it('should throw 401 if auth is not present', () => {
      const mockCaption = 'mock-post-caption';
      request(app.getHttpServer())
        .post('/v1/post')
        .field('caption', mockCaption)
        .expect(401);
    });

    it('should throw 401 if jwt is incorrect', () => {
      const mockCaption = 'mock-post-caption';
      const wrongJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      request(app.getHttpServer())
        .post('/v1/post')
        .set({ Authorization: `Bearer ${wrongJwt}` })
        .field('caption', mockCaption)
        .expect(401);
    });

    it('should create post without Image', async () => {
      const mockCaption = 'mock-post-caption';
      const res = await request(app.getHttpServer())
        .post('/v1/post')
        .set({ Authorization: `Bearer ${jwt}` })
        .field('caption', mockCaption);

      expect(res.statusCode).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.caption).toEqual(mockCaption);
      expect(res.body.createdById).toEqual(userId);
    });

    ['png', 'jpg'].forEach((imgType) => {
      it(`should create post with valid ${imgType} image`, async () => {
        const mockCaption = 'mock-post-caption';
        const filePath = path.join(__dirname, `../images/bandlab.${imgType}`);

        const res = await request(app.getHttpServer())
          .post('/v1/post')
          .set({ Authorization: `Bearer ${jwt}` })
          .field('caption', mockCaption)
          .attach('image', filePath);

        expect(res.statusCode).toBe(201);
        expect(res.body).toBeDefined();
        expect(res.body.caption).toEqual(mockCaption);
        expect(res.body.createdById).toEqual(userId);
        expect(res.body.rawImgFilePath).toBeDefined();
        expect(res.body.processedImgFilePath).toBeDefined();
      });
    });

    it(`should not create post with invalid image`, async () => {
      const mockCaption = 'mock-post-caption';
      const filePath = path.join(__dirname, `../images/bandlab.dng`);

      const res = await request(app.getHttpServer())
        .post('/v1/post')
        .set({ Authorization: `Bearer ${jwt}` })
        .field('caption', mockCaption)
        .attach('image', filePath);

      expect(res.statusCode).toBe(400);
      expect(res.body).toBeDefined();
      expect(res.body.message).toEqual(
        `Validation failed (expected type is /(jpg|jpeg|png|bmp)$/i)`,
      );
    });
  });
});
