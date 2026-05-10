FROM oven/bun:1

WORKDIR /app
RUN chown bun:bun /app

USER bun

COPY --chown=bun:bun package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY --chown=bun:bun prisma ./prisma
RUN bun run db:generate

COPY --chown=bun:bun src ./src
COPY --chown=bun:bun tsconfig.json eslint.config.mjs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
