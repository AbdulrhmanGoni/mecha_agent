import { Hono } from "hono";
import { UsersController } from "../controllers/UsersController.ts";

export default function usersRoutesBuilder(
    usersController: UsersController,
) {
    const authRoutes = new Hono();

    authRoutes.get('/',
        usersController.getUserData.bind(usersController)
    );

    return authRoutes;
};
