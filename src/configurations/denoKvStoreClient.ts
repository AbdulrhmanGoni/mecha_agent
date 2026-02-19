import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export const kvStoreClient = await Deno.openKv(parsedEnvVariables.ENVIRONMENT === "testing" ? ":memory:" : undefined)

if (parsedEnvVariables.ENVIRONMENT === "development") {
    // For more details, see: https://jsr.io/@denokv-gui-client/bridge-server
    const { openBridgeServerInDeno } = await import("@denokv-gui-client/bridge-server")
    openBridgeServerInDeno(kvStoreClient, { port: 8989, authToken: "@denokv-gui-client/bridge-server" });
}
