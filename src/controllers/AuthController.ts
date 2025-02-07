import { Context } from "hono";
import { AuthService } from "../services/AuthService.ts";

export class AuthController {
    constructor(private authService: AuthService) { }

    async logInAsRoot(c: Context<never, never, { out: { json: LogInInput } }>) {
        const body = c.req.valid("json");
        const result = await this.authService.logInAsRoot(body.username, body.password);
        return c.json({ result }, 200);
    }

    async getRootUserData(c: Context) {
        const result = await this.authService.getRootUserData();
        return c.json({ result }, 200);
    }
}

