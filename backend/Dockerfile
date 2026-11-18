# Image de production de l'API (compose.yaml). Le dev utilise node:22-slim + volume (compose.dev.yaml).

FROM node:22-slim AS build
WORKDIR /app
# mongodb-memory-server (tests) télécharge un binaire mongod à l'installation : inutile ici
ENV MONGOMS_DISABLE_POSTINSTALL=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
