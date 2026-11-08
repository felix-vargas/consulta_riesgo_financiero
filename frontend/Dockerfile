# Stage 1: Build React + Vite SPA
FROM node:22-alpine AS builder

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=frontend

COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Stage 2: Serve static bundle & proxy /api via unprivileged Nginx
FROM nginxinc/nginx-unprivileged:alpine AS runner

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/frontend/dist /usr/share/nginx/html

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
