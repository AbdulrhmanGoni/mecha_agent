import { Context } from "npm:hono";
import { AuthService } from "../services/AuthService.ts";

export class AuthController {
    constructor(private authService: AuthService) { }

    async logInAsRoot(c: Context) {
        const body = await c.req.json();
        const result = await this.authService.logInAsRoot(body.username, body.password);
        return c.json({ result }, 200);
    }

    async getRootData(c: Context) {
        const result = await this.authService.getRootData();
        return c.json({ result }, 200);
    }
}

