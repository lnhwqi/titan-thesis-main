FROM node:20-alpine AS builder

WORKDIR /app

# Root dependencies are required by shared Core imports used by Web.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Web dependencies include Vite and React tooling for build.
COPY Web/package.json Web/package-lock.json ./Web/
RUN npm ci --prefix ./Web

# Copy source code after dependencies for better layer caching.
COPY Core ./Core
COPY Web ./Web

WORKDIR /app/Web

# Vite envs are build-time variables.
ARG VITE_APP_ENV=production
ARG VITE_API_HOST
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_API_HOST=${VITE_API_HOST}

RUN ./node_modules/.bin/vite build --mode production


FROM nginx:1.27-alpine

COPY --from=builder /app/Web/dist /usr/share/nginx/html

# SPA fallback: route unknown paths to index.html.
RUN printf 'server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
