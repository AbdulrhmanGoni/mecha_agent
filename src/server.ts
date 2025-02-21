import bootstrapApp from "./app.ts";
import parsedEnvVariables from "./configurations/parseEnvironmentVariables.ts";

const app = await bootstrapApp();

Deno.serve({ port: parsedEnvVariables.SERVER_PORT }, app.fetch);
