import { Context } from "hono";
import { AuthService } from "../services/AuthService.ts";
import authResponsesMessages from "../constant/response-messages/authResponsesMessages.ts";

export class AuthController {
    constructor(private authService: AuthService) { }

    async signUpUser(c: Context<never, never, { out: { json: SignUpUserInput } }>) {
        const userInput = c.req.valid("json");

        const result = await this.authService.signUpUser(userInput);

        if (result.newUser) {
            return c.json({ result: result.newUser });
        }

        if (result.userExists) {
            const signingExistingUserQuery = c.req.query("signing-existing-user");

            if (signingExistingUserQuery && ["true", "yes", "1"].includes(signingExistingUserQuery)) {
                return this.signInUser(c)
            }

            if (result.notSameSigningMethod) {
                return c.json({ error: authResponsesMessages.userSignedUpWithAnotherMethod }, 400)
            }

            return c.json({ error: authResponsesMessages.userAlreadyExisting }, 400)
        }

        if (authResponsesMessages.notVerifiedEmail) {
            return c.json({ error: authResponsesMessages.notVerifiedEmail }, 400)
        }

        throw new Error("Failed to sign up a new user");
    }

    async signInUser(c: Context<never, never, { out: { json: SignInUserInput } }>) {
        const userInput = c.req.valid("json");
        const result = await this.authService.signInUser(userInput);

        if (result.success && result.user) {
            return c.json({ result: result.user });
        }

        if (result.tooManyTries) {
            return c.json({ error: authResponsesMessages.tooManyTries }, 429);
        }

        if (result.wrongSigningMethod) {
            return c.json({ error: authResponsesMessages.userSignedUpWithAnotherMethod }, 401);
        }

        if (result.noUser) {
            return c.json({ error: authResponsesMessages.noUser }, 401);
        }

        return c.json({ error: authResponsesMessages.wrongCredentials }, 401);
    }

    async verifyEmailRequest(c: Context<never, never, { out: { query: verifyEmailRequestInput } }>) {
        const { email, checkExistance } = c.req.valid("query");

        if (checkExistance) {
            const emailExists = await this.authService.checkEmailExistance(email)
            return c.json({ result: emailExists });
        }

        const { otpSent, signature } = await this.authService.generateAndSendOTP(email)
        if (otpSent) {
            return c.json({ result: signature });
        }

        return c.json({ error: authResponsesMessages.failedToSendOTP }, 400);
    }

    async verifyEmailResponse(c: Context<never, never, { out: { query: VerifyEmailResponseInput } }>) {
        const input = c.req.valid("query");

        const verified = await this.authService.verifyOTP(input)
        if (verified) {
            return c.json({ result: true });
        }

        return c.json({ error: authResponsesMessages.failedToVerifyOTP }, 400);
    }

    async changePassword(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: ChangePasswordInput } }>) {
        const input = c.req.valid("json");
        const userEmail = c.get("userEmail");

        const { success, wrongSigningMethod, wrongPassword } = await this.authService.changePassword(userEmail, input);

        if (success) {
            return c.json({ result: authResponsesMessages.passwordChangedSuccessfully });
        }

        if (wrongPassword) {
            return c.json({ error: authResponsesMessages.wrongCurrentPassword }, 400);
        }

        if (wrongSigningMethod) {
            return c.json({ error: authResponsesMessages.passwordCantBeChanged }, 400);
        }

        throw new Error(authResponsesMessages.unexpectedChangePasswordError)
    }

    async resetPassword(c: Context<never, never, { out: { json: ResetPasswordInput } }>) {
        const { email, newPassword } = c.req.valid("json");

        const { success, notVerifiedEmail, wrongSigningMethod } = await this.authService.resetPassword(email, newPassword)

        if (success) {
            return c.json({ result: authResponsesMessages.passwordResetSuccessfully });
        }

        if (notVerifiedEmail) {
            return c.json({ error: authResponsesMessages.notVerifiedEmail }, 400)
        }

        if (wrongSigningMethod) {
            return c.json({ error: authResponsesMessages.passwordCantBeChanged }, 400)
        }

        throw new Error(authResponsesMessages.resetPasswordFailed)
    }
}

