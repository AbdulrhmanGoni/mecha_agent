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

        const signingExistingUserQuery = c.req.query("signing-existing-user");

        if (signingExistingUserQuery && ["true", "yes", "1"].includes(signingExistingUserQuery)) {
            return this.signInUser(c)
        }

        if (result.existingWithSameSigingMethod) {
            return c.json({ error: authResponsesMessages.userAlreadyExisting }, 400)
        }

        if (result.notVerifiedEmail) {
            return c.json({ error: authResponsesMessages.notVerifiedEmail }, 400)
        }

        return c.json({ error: authResponsesMessages.userSignedInWithAnotherMethod }, 400)
    }

    async signInUser(c: Context<never, never, { out: { json: SignInUserInput } }>) {
        const userInput = c.req.valid("json");
        const result = await this.authService.signInUser(userInput);

        if (result.success && result.user) {
            return c.json({ result: result.user });
        }

        if (result.wrongSigningMethod) {
            return c.json({ error: authResponsesMessages.userSignedInWithAnotherMethod }, 401);
        }

        if (result.noUser) {
            return c.json({ error: authResponsesMessages.noUser }, 401);
        }

        return c.json({ error: authResponsesMessages.wrongCredentials }, 401);
    }

    async verifyEmailRequestInput(c: Context<never, never, { out: { query: verifyEmailRequestInput } }>) {
        const { email } = c.req.valid("query");
        const { otpSent, signature } = await this.authService.generateAndSendOTP(email)
        if (otpSent) {
            return c.json({ result: signature });
        }

        return c.json({ error: authResponsesMessages.failedToSendOTP }, 400);
    }

    verifyEmailResponseInput(c: Context<never, never, { out: { query: verifyEmailResponseInput } }>) {
        const { email, otp, signature } = c.req.valid("query");

        const verified = this.authService.verifyOTP(email, otp, signature)
        if (verified) {
            return c.json({ result: true });
        }

        return c.json({ error: authResponsesMessages.failedToVerifyOTP }, 400);
    }
}

