# Stage 1: Build TypeScript backend
FROM node:22-alpine AS builder

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=backend

COPY backend/ ./backend/
RUN npm run build --workspace=backend

# Stage 2: Minimal production runtime with non-root user
FROM node:22-alpine AS runner

ENV NODE_ENV=production

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci --omit=dev --workspace=backend && npm cache clean --force

COPY --from=builder /workspace/backend/dist ./backend/dist

USER node

EXPOSE 4000

CMD ["node", "backend/dist/index.js"]
