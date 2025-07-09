import { Hono } from "hono";
import { AuthController } from "../controllers/AuthController.ts";
import signInValidator from "../validation/auth/signInValidator.ts";
import signUpValidator from "../validation/auth/signUpValidator.ts";
import verifyEmailResponseInputValidator from "../validation/auth/verifyEmailResponseInputValidator.ts";
import verifyEmailRequestInputValidator from "../validation/auth/verifyEmailRequestInputValidator.ts";
import { GuardService } from "../services/GuardService.ts";
import changePasswordInputValidator from "../validation/auth/changePasswordInputValidator.ts";

export default function authRoutesBuilder(
    authController: AuthController,
    guardService: GuardService,
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
        authController.verifyEmailRequest.bind(authController)
    );

    authRoutes.post(
        '/verify-email',
        verifyEmailResponseInputValidator,
        authController.verifyEmailResponse.bind(authController)
    );

    authRoutes.post(
        '/change-password',
        guardService.guardRoute({ sudoOnly: true }),
        changePasswordInputValidator,
        authController.changePassword.bind(authController)
    );

    return authRoutes;
};
