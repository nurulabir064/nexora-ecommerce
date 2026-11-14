# NEXORA single-origin production container.
# Build and runtime use the same Node major/minor line for native modules (argon2).
FROM node:26.13.1-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:26.13.1-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist
ENV PORT=5000
EXPOSE 5000
USER node
CMD ["npm", "run", "start"]
