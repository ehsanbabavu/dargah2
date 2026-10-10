# Stage 1: Build Stage
FROM node:20-slim AS builder

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package configurations
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY components.json ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm install --no-audit

# Copy application source code and attached assets
COPY client/ ./client
COPY server/ ./server
COPY shared/ ./shared
COPY public/ ./public

# Ensure attached_assets exists and copy if present
RUN mkdir -p attached_assets
COPY attached_assets/ ./attached_assets/

# Build frontend and server bundles
RUN npm run build

# Stage 2: Production Runtime Stage
FROM node:20-slim AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Copy package config, tsconfig and drizzle config
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Copy shared folder containing schema.ts for drizzle-kit db:push
COPY shared/ ./shared
COPY data-*.json ./

# Reuse already installed node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled bundles from the builder stage
COPY --from=builder /app/dist ./dist

# Copy public assets and attached_assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/attached_assets ./attached_assets
COPY --from=builder /app/client ./client

# Create directories for dynamic uploads and system files
RUN mkdir -p uploads stamppic public/invoices && chmod -R 755 uploads stamppic public/invoices

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
