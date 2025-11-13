# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy dependencies and application code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000

# Stage 3: Start the application
CMD ["node", "server.js"]