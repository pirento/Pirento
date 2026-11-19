# One image for every service; SERVICE picks which one runs.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY services/auth/package.json services/auth/
COPY services/wallet/package.json services/wallet/
COPY services/catalog/package.json services/catalog/
COPY services/gateway/package.json services/gateway/
COPY services/orders/package.json services/orders/
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
USER node
ARG SERVICE=gateway
ENV SERVICE=${SERVICE}
CMD ["sh", "-c", "node services/$SERVICE/src/index.js"]
