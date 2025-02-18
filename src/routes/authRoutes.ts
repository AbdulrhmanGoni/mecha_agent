import { Hono } from "hono";
import { AuthController } from "../controllers/AuthController.ts";
import signInValidator from "../validation/auth/signInValidator.ts";
import signUpValidator from "../validation/auth/signUpValidator.ts";

export default function authRoutesBuilder(
    authController: AuthController,
) {
    const authRoutes = new Hono();

    authRoutes.post('/sign-in',
        signInValidator,
        authController.signInUser.bind(authController)
    );

    authRoutes.post(
        '/sign-up',
        signUpValidator,
        authController.signUpUser.bind(authController)
    );

    return authRoutes;
};
