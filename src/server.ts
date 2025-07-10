import * as Sentry from "sentry";
import bootstrapApp from "./app.ts";
import parsedEnvVariables from "./configurations/parseEnvironmentVariables.ts";

Sentry.init({
    dsn: parsedEnvVariables.SENTRY_DSN,
});

const appStart = performance.now();
console.log("Application starting...");
const app = await bootstrapApp();
console.log(`Application started in ${((performance.now() - appStart) / 1000).toFixed(3)}s`);

Deno.serve({ port: parsedEnvVariables.SERVER_PORT }, app.fetch);
