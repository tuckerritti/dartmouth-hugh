import cors from "cors";
import express from "express";
import helmet from "helmet";
import * as Sentry from "@sentry/bun";
import config from "./config";
import routes from "./routes";
import errorHandler from "./middleware/errorHandler";
import { startScheduler } from "./services/scheduler";

const app = express();

app.disable("x-powered-by");
app.enable("trust proxy");

app.use(helmet());

app.use(
	cors({
		origin: config.FRONTEND_ORIGIN,
	}),
);

app.use(express.json());

routes(app);

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

startScheduler();

app.listen(config.PORT, () => {
	console.log(`Listening on port ${config.PORT}`);
});
