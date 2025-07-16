import { Context } from "hono";
import { requestLatencyRanges } from "../constant/requestLatencyRanges.ts";

export class MetricsController {
    constructor(private kvStoreClient: Deno.Kv) { }

    private async getTrafficMetrics() {
        const metrics: string[] = [];

        for await (const entity of this.kvStoreClient.list<bigint>({ prefix: ["total_http_requests"] })) {
            const [, path, method, status] = entity.key
            metrics.push(
                `total_http_requests{path="${path.toString()}", method="${method.toString()}", status="${status.toString()}"} ${entity.value}`
            )
        }

        const latenciesKeys = requestLatencyRanges.map((range) => ["http_requests_latencies", range]);
        const latencies = await this.kvStoreClient.getMany<bigint[]>(latenciesKeys);

        return {
            metrics,
            latencies,
        }
    };

    async exposeTrafficMetrics(c: Context) {
        const {
            metrics,
            latencies,
        } = await this.getTrafficMetrics()

        return c.body(
            (
                metrics.length ?
                    "# HELP total_http_requests Total number of HTTP requests\n" +
                    "# TYPE total_http_requests counter\n" +
                    metrics.join("\n") + "\n\n" : ""
            ) +
            "# HELP http_requests_latencies The ranges of HTTP requests latencies in seconds\n" +
            "# TYPE http_requests_latencies histogram\n" +
            `${latencies
                .map((l) => `http_requests_latencies_bucket{le="${String(l.key[1]) === "Infinity" ? "+Inf" : String(l.key[1])}"} ${l.value || 0}`)
                .join("\n")
            }\n`,
            { headers: { "Content-Type": "text/plain; version=0.0.4" }, status: 200 }
        )
    }
}
