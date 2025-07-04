# Codex Environment Quick Setup

This project uses Node.js 18+ and Yarn. To speed up initialization in Codex, you can prepare a Docker image or cache `node_modules` so the environment can start immediately.

## Prebuild the Docker image
1. Create a `Dockerfile` in the project root with:
   ```Dockerfile
   FROM node:20
   WORKDIR /app

   COPY package.json yarn.lock ./
   COPY lib/models/schema.prisma ./lib/models/

   RUN yarn install --frozen-lockfile

   COPY . .

   ```
2. Build the image once and push it to [Docker Hub](https://hub.docker.com/):
   ```bash
   docker build -t rohanmathurrhyzome/my-mesh-image .
   docker push rohanmathurrhyzome/my-mesh-image
   ```
3. Use this image when launching Codex. Add the following to the Setup script so the container pulls the image automatically:
   ```bash
   docker pull rohanmathurrhyzome/my-mesh-image
   ```
   Dependencies are already installed, so the container starts quickly.

## Cache dependencies
If you do not use a Docker image, run `yarn install` once and save the resulting `node_modules` directory. Restore it on future runs to skip reinstallation.

## Prepare environment variables
Create `.env.local` with your keys and copy it to `.env` so Prisma can read them:
```bash
cp .env.local .env
```

## Start the server
After restoring the cache or pulling the Docker image, just run:
```bash
yarn dev
```
The application will be available at `http://localhost:3000`.
