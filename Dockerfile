# --- deps ---------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- build --------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- runtime ------------------------------------------------------------
# Uses Next's standalone output so the image ships only what it needs.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN apk add --no-cache tini curl && addgroup -S unichat && adduser -S unichat -G unichat

COPY --from=build --chown=unichat:unichat /app/.next/standalone ./
COPY --from=build --chown=unichat:unichat /app/.next/static ./.next/static
COPY --from=build --chown=unichat:unichat /app/public ./public

USER unichat
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:3000/login || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
