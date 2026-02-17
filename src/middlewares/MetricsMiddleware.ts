import { Context, Next } from "hono";
import { requestLatencyRanges } from "../constant/requestLatencyRanges.ts";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export class MetricsMiddleware {
    constructor(private kvStoreClient: Deno.Kv) { }

    private excludeRoutes = ["/api/metrics", "/health-check"]

    async collectTrafficMetrics(c: Context, next: Next) {
        const start = performance.now();
        await next();
        const resTimeSec = parsedEnvVariables.ENVIRONMENT === "development" ?
            Number((Math.random() * 6).toFixed(1)) :
            Number(((performance.now() - start) / 1000))

        if (this.excludeRoutes.some((path) => c.req.path.startsWith(path))) {
            return
        }

        let latencyRange = 0;

        for (let i = 0; i < requestLatencyRanges.length - 1; i++) {
            if (resTimeSec <= requestLatencyRanges[i]) {
                latencyRange = requestLatencyRanges[i];
                break;
            }
        }

        if (latencyRange === 0) {
            latencyRange = Infinity
        }

        console.log(c.req.method, c.req.routePath, c.res.status, resTimeSec + "s")
        await this.kvStoreClient.
            atomic()
            .sum(["total_http_requests", c.req.routePath, c.req.method, c.res.status], 1n)
            .sum(["http_requests_latencies", latencyRange], 1n)
            .commit();
    };
}
