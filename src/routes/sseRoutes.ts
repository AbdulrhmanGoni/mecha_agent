import { Hono } from "hono";
import { SSEController } from "../controllers/SSEController.ts";

export default function sseRoutesBuilder(sseController: SSEController) {
    const sseRoutes = new Hono();

    sseRoutes.get(
        '/:event/:target',
        sseController.subscribe.bind(sseController)
    );

    return sseRoutes;
};
