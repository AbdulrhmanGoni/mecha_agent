import { Hono } from "hono";
import { MediaController } from "../controllers/MediaController.ts";
import { GuardService } from "../services/GuardService.ts";
import { readPermission } from "../constant/permissions.ts";

export default function mediaRoutesBuilder(mediaController: MediaController, guardService: GuardService) {
    const mediaRoutes = new Hono();

    mediaRoutes.get(
        '/:scope/:mediaName',
        guardService.guardRoute({ permissions: [readPermission] }),
        mediaController.getMedia.bind(mediaController)
    );

    return mediaRoutes;
};
