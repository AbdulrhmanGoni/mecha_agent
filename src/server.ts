import * as Sentry from "sentry";
import bootstrapApp from "./app.ts";
import parsedEnvVariables from "./configurations/parseEnvironmentVariables.ts";

Sentry.init({
    dsn: parsedEnvVariables.SENTRY_DSN,
});

const app = await bootstrapApp();

Deno.serve({ port: parsedEnvVariables.SERVER_PORT }, app.fetch);
