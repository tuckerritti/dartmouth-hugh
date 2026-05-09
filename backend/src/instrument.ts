import * as Sentry from "@sentry/bun";

const sentryDsn = process.env.SENTRY_DSN?.trim();
const sentryEnabled = Boolean(sentryDsn);

Sentry.init({
	dsn: sentryDsn || undefined,
	enabled: sentryEnabled,
	sendDefaultPii: true,
	enableLogs: sentryEnabled,
});
