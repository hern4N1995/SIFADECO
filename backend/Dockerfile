# backend/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
# Try a clean CI install; if lockfile is out of sync fallback to a production install
RUN npm ci --production || npm install --production

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/App.js"]
