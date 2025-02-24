import { Context } from "hono";
import { UsersService } from "../services/UsersService.ts";
import authResponsesMessages from "../constant/response-messages/authResponsesMessages.ts";

export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    async getUserData(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const user = await this.usersService.getByEmail(userEmail)

        if (user) {
            const { password: _, username: name, ...userData } = user
            return c.json({ result: { name, ...userData } })
        }

        return c.json({ error: authResponsesMessages.noUser }, 400)
    }
}
