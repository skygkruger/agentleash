# ═══════════════════════════════════════════════════════════════
# SCOPEAGENT DAEMON DOCKERFILE
# For server-side/containerized deployments
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

# Default command - can be overridden
ENTRYPOINT ["node", "dist/index.js"]
CMD ["start"]
