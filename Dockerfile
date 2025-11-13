# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy dependencies and application code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3001
ENV HOST=0.0.0.0
ENV PORT=3001

# Stage 3: Start the application
CMD ["node", "server.js"]
