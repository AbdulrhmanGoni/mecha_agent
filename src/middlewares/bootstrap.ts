import { InferencesMiddleware } from "./InferencesMiddleware.ts";
import { MetricsMiddleware } from "./MetricsMiddleware.ts";
import { Client as PostgresClient } from "deno.land/x/postgres";

type MiddlewaresDependencies = {
    configs: {
        kvStoreClient: Deno.Kv;
        databaseClient: PostgresClient;
    }
}

export default function bootstrapMiddlewares(dependencies: MiddlewaresDependencies) {
    const metricsMiddleware = new MetricsMiddleware(
        dependencies.configs.kvStoreClient
    );

    const inferencesMiddleware = new InferencesMiddleware(
        dependencies.configs.kvStoreClient,
        dependencies.configs.databaseClient,
    );

    return {
        metricsMiddleware,
        inferencesMiddleware,
    }
};
