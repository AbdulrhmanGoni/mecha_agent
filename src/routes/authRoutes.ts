import { Hono } from "hono";
import { AuthController } from "../controllers/AuthController.ts";
import signInValidator from "../validation/auth/signInValidator.ts";
import signUpValidator from "../validation/auth/signUpValidator.ts";
import verifyEmailResponseInputValidator from "../validation/auth/verifyEmailResponseInputValidator.ts";
import verifyEmailRequestInputValidator from "../validation/auth/verifyEmailRequestInputValidator.ts";

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

    authRoutes.get(
        '/verify-email',
        verifyEmailRequestInputValidator,
        authController.verifyEmailRequestInput.bind(authController)
    );

    authRoutes.post(
        '/verify-email',
        verifyEmailResponseInputValidator,
        authController.verifyEmailResponseInput.bind(authController)
    );

    return authRoutes;
};
