FROM node:20-bullseye-slim AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

FROM node:20-bullseye-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3007

COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3007
CMD ["node", "server.js"]
