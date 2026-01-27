# ═══════════════════════════════════════════════════════════════
# SCOPEAGENT API DOCKERFILE
# Production-ready Node.js container
# ═══════════════════════════════════════════════════════════════

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# ───────────────────────────────────────────────────────────────
# Production stage
# ───────────────────────────────────────────────────────────────

FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 scopeagent

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --production && npm cache clean --force

# Set ownership
RUN chown -R scopeagent:nodejs /app

USER scopeagent

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
