import { Hono } from "hono";
import { MetricsController } from "../controllers/MetricsController.ts";

export default function metricsRoutesBuilder(
    metricsController: MetricsController,
) {
    const metricsRoutes = new Hono();

    metricsRoutes.get('/traffic',
        metricsController.exposeTrafficMetrics.bind(metricsController)
    );

    return metricsRoutes;
};
