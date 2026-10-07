FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
# schema 尚未拷入，postinstall 的 generate 会被跳过
RUN npm install --include=dev --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

FROM node:20
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma/schema.prisma ./prisma/schema.prisma
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 29504
ENTRYPOINT ["./entrypoint.sh"]
