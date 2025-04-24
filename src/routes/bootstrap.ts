import { Hono } from "hono";
import chatsRoutesBuilder from "./chatsRoutes.ts";
import instructionsRoutesBuilder from "./instructionsRoutes.ts";
import { InstructionsController } from "../controllers/InstructionsController.ts";
import { ChatsController } from "../controllers/ChatsController.ts";
import { ApiKeysController } from "../controllers/ApiKeysController.ts";
import apiKeysRoutesBuilder from "./apiKeysRoutes.ts";
import { AuthController } from "../controllers/AuthController.ts";
import authRoutesBuilder from "./authRoutes.ts";
import agentsRoutesBuilder from "./agentsRoutes.ts";
import datasetsRoutesBuilder from "./datasetsRoutes.ts";
import { AgentsController } from "../controllers/AgentsController.ts";
import mediaRoutesBuilder from "./mediaRoutes.ts";
import { MediaController } from "../controllers/MediaController.ts";
import { DatasetsController } from "../controllers/DatasetsController.ts";
import { GuardService } from "../services/GuardService.ts";
import sseRoutesBuilder from "./sseRoutes.ts";
import { SSEController } from "../controllers/SSEController.ts";
import { UsersController } from "../controllers/UsersController.ts";
import usersRoutesBuilder from "./usersRoutes.ts";
import globalErrorsHandler from "../helpers/globalErrorsHandler.ts";
import metricsRoutesBuilder from "./metricsRoutes.ts";
import { MetricsMiddleware } from "../middlewares/MetricsMiddleware.ts";
import { MetricsController } from "../controllers/MetricsController.ts";

type RoutesDependencies = {
    controllers: {
        usersController: UsersController;
        agentsController: AgentsController;
        datasetsController: DatasetsController;
        instructionsController: InstructionsController;
        apiKeysController: ApiKeysController;
        chatsController: ChatsController;
        authController: AuthController;
        mediaController: MediaController;
        sseController: SSEController;
        metricsController: MetricsController;
    },
    middlewares: {
        metricsMiddleware: MetricsMiddleware;
    },
    services: {
        guardService: GuardService;
    }
}

export default function bootstrapRoutes(dependencies: RoutesDependencies) {
    const usersRoutes = usersRoutesBuilder(
        dependencies.controllers.usersController,
        dependencies.services.guardService
    );

    const authRoutes = authRoutesBuilder(
        dependencies.controllers.authController,
    );

    const agentsRoutes = agentsRoutesBuilder(
        dependencies.controllers.agentsController,
        dependencies.services.guardService
    );

    const instructionsRoutes = instructionsRoutesBuilder(
        dependencies.controllers.instructionsController,
        dependencies.services.guardService
    );

    const apiKeysRoutes = apiKeysRoutesBuilder(
        dependencies.controllers.apiKeysController,
        dependencies.services.guardService
    );

    const mediaRoutes = mediaRoutesBuilder(
        dependencies.controllers.mediaController,
        dependencies.services.guardService
    );

    const chatsRoutes = chatsRoutesBuilder(
        dependencies.controllers.chatsController,
        dependencies.services.guardService,
    );

    const datasetsRoutes = datasetsRoutesBuilder(
        dependencies.controllers.datasetsController,
        dependencies.services.guardService
    );

    const sseRoutes = sseRoutesBuilder(
        dependencies.controllers.sseController,
    );

    const metricsRoutes = metricsRoutesBuilder(
        dependencies.controllers.metricsController,
    );

    const api = new Hono();

    api.use(
        dependencies.middlewares.metricsMiddleware.collectTrafficMetrics.bind(
            dependencies.middlewares.metricsMiddleware
        ),
    );

    api.route('/auth', authRoutes);
    api.route('/users', usersRoutes);
    api.route('/agents', agentsRoutes);
    api.route('/instructions', instructionsRoutes);
    api.route('/api-keys', apiKeysRoutes);
    api.route('/media', mediaRoutes);
    api.route('/chats', chatsRoutes);
    api.route('/datasets', datasetsRoutes);
    api.route('/sse', sseRoutes);
    api.route('/metrics', metricsRoutes);
    api.get('/health-check', (c) => c.body("The server is up and running", 200));

    const app = new Hono().route("/api", api);

    app.onError(globalErrorsHandler)

    return app
};
