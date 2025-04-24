import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export const kvStoreClient = await Deno.openKv(parsedEnvVariables.DENO_ENV === "testing" ? ":memory:" : undefined)

