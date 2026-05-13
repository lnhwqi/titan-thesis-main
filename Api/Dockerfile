FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# tsx is used to run the TypeScript API entrypoint.
RUN npm install -g tsx

# Root dependencies are required by shared Core imports (for example: decoders).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# API-local dependencies are required by Api/src runtime imports (for example: express).
COPY Api/package.json Api/package-lock.json ./Api/
RUN npm ci --omit=dev --prefix ./Api

# Copy source code after dependencies for better layer caching.
COPY Core ./Core
COPY Api ./Api

# API serves files from /app/uploads via Api/src/Uploads.ts.
RUN mkdir -p /app/uploads

WORKDIR /app/Api
EXPOSE 3001

CMD ["tsx", "src/index.ts"]
