import { Hono } from "hono";
import { UsersController } from "../controllers/UsersController.ts";
import { GuardService } from "../services/GuardService.ts";
import { readPermission } from "../constant/permissions.ts";

export default function usersRoutesBuilder(
    usersController: UsersController,
    guardService: GuardService
) {
    const authRoutes = new Hono();

    authRoutes.get('/',
        guardService.guardRoute({ permissions: [readPermission] }),
        usersController.getUserData.bind(usersController)
    );

    return authRoutes;
};
