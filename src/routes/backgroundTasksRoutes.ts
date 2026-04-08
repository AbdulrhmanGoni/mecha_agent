import { Hono } from "hono";
import { BackgroundTasksController } from "../controllers/BackgroundTasksController.ts";

export default function backgroundTasksRoutesBuilder(
    backgroundTasksController: BackgroundTasksController
) {
    const backgroundTasksRoutes = new Hono()

    backgroundTasksRoutes.post("/", backgroundTasksController.handleBackgroundTask.bind(backgroundTasksController))

    return backgroundTasksRoutes
};
