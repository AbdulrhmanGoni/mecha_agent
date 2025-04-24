import { MetricsMiddleware } from "./MetricsMiddleware.ts";

type MiddlewaresDependencies = {
    configs: {
        kvStoreClient: Deno.Kv;
    }
}

export default function bootstrapMiddlewares(dependencies: MiddlewaresDependencies) {
    const metricsMiddleware = new MetricsMiddleware(
        dependencies.configs.kvStoreClient
    );

    return {
        metricsMiddleware,
    }
};
