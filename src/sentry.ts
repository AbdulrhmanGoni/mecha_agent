import * as Sentry from "sentry";
import parsedEnvVariables from "./configurations/parseEnvironmentVariables.ts";

Sentry.init({
    dsn: parsedEnvVariables.SENTRY_DSN,
});

export default Sentry