## Description

**Coding Assignment**

What to build:

- A system that allows you to upload images and comment on them
- No frontend/UI is required

User stories (where the user is an API consumer):
- As a user, I should be able to create posts with images (1 post - 1 image)
- As a user, I should be able to set a text caption when I create a post
- As a user, I should be able to comment on a post
- As a user, I should be able to delete a comment (created by me) from a post
- As a user, I should be able to get the list of all posts along with the last 2 comments
on each post

Functional requirements:
- RESTful Web API (JSON)
- Maximum image size - 100MB
- Allowed image formats: .png, .jpg, .bmp.
- Save uploaded images in the original format
- Convert uploaded images to .jpg format and resize to 600x600
- Serve images only in .jpg format
- Posts should be sorted by the number of comments (desc)
- Retrieve posts via a cursor-based pagination

## Project setup

Ensure you have node v18 installed on your OS.

```bash
$ npm install
$ docker compose up
```

**Create .env file in root dir and populate values**

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

Make sure docker containers are up

```bash
$ docker compose up
```

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Inspect AWS Resources

```bash
aws --endpoint-url http://localstack:61160 s3 ls s3://local-post-images --recursive --human-readable
```
