import { Context } from "hono";
import { AuthService } from "../services/AuthService.ts";
import { HTTPException } from "hono/http-exception";
import authResponsesMessages from "../constant/response-messages/authResponsesMessages.ts";

export class AuthController {
    constructor(private authService: AuthService) { }

    async logInAsRoot(c: Context<never, never, { out: { json: LogInInput } }>) {
        const body = c.req.valid("json");
        const result = await this.authService.logInAsRoot(body.username, body.password);

        if (result) {
            return c.json({ result }, 200);
        }

        throw new HTTPException(401, { message: authResponsesMessages.wrongCredentials })
    }

    async getRootUserData(c: Context) {
        const result = await this.authService.getRootUserData();
        return c.json({ result }, 200);
    }
}

