import { Hono } from "hono";
import { MetricsController } from "../controllers/MetricsController.ts";
import { GuardService } from "../services/GuardService.ts";

export default function metricsRoutesBuilder(
    metricsController: MetricsController,
    guardService: GuardService,
) {
    const metricsRoutes = new Hono();

    metricsRoutes.get('/traffic',
        guardService.guardMetricsRoute(),
        metricsController.exposeTrafficMetrics.bind(metricsController)
    );

    return metricsRoutes;
};
