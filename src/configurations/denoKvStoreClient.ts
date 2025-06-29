import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export const kvStoreClient = await Deno.openKv(parsedEnvVariables.ENVIRONMENT === "testing" ? ":memory:" : undefined)

