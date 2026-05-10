#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
	: "${DATABASE_HOST:?DATABASE_HOST is required when DATABASE_URL is not set}"
	: "${DATABASE_PORT:?DATABASE_PORT is required when DATABASE_URL is not set}"
	: "${DATABASE_NAME:?DATABASE_NAME is required when DATABASE_URL is not set}"
	: "${DATABASE_USER:?DATABASE_USER is required when DATABASE_URL is not set}"
	: "${DATABASE_PASSWORD:?DATABASE_PASSWORD is required when DATABASE_URL is not set}"

	DATABASE_URL="$(
		bun -e '
const url = new URL("postgresql://localhost");
url.hostname = process.env.DATABASE_HOST ?? "";
url.port = process.env.DATABASE_PORT ?? "";
url.pathname = `/${process.env.DATABASE_NAME ?? ""}`;
url.username = process.env.DATABASE_USER ?? "";
url.password = process.env.DATABASE_PASSWORD ?? "";
process.stdout.write(url.toString());
'
	)"
	export DATABASE_URL
fi

if [ "${1:-}" = "bun" ] && [ "${2:-}" = "run" ] && [ "${3:-}" = "start" ]; then
	bun run db:deploy
fi

exec "$@"
