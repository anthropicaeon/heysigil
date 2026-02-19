FROM node:20-alpine AS build

WORKDIR /app

COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/sigilbot/package.json ./packages/sigilbot/package.json
COPY packages/sigilbot/tsconfig.json ./packages/sigilbot/tsconfig.json
COPY packages/sigilbot/src ./packages/sigilbot/src

WORKDIR /app/packages/sigilbot
RUN npm install
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/packages/sigilbot/package.json ./package.json
COPY --from=build /app/packages/sigilbot/dist ./dist

RUN npm install --omit=dev --ignore-scripts

EXPOSE 8789

CMD ["node", "dist/cli.js"]
