import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('AppController (e2e)', () => {
  let app: INestApplication, connection: DataSource;

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
  });

  afterAll(async () => {
    await connection.synchronize(true); // Resets the database schema and clears data
    await connection.destroy();
    await app.close();
  });

  describe('POST /v1/auth/login', () => {
    let username: string, password: string;
    beforeEach(async () => {
      // seed user
      const uuid = randomUUID();
      username = `mock-username-${uuid}`;
      password = `mock-password-${uuid}`;

      const res = await request(app.getHttpServer()).post('/v1/user').send({
        username,
        password,
        firstName: 'mock',
        lastName: 'user',
      });
      expect(res.statusCode).toBe(201);
    });

    it('should login successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username,
          password,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.access_token).toBeDefined();
    });

    it('should throw 401 for wrong password', () => {
      request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          username,
          password: 'wrong-password',
        })
        .expect(401);
    });
  });
});
