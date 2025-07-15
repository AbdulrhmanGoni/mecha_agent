import { Context } from "hono";
import { UsersService } from "../services/UsersService.ts";
import authResponsesMessages from "../constant/response-messages/authResponsesMessages.ts";
import usersResponsesMessages from "../constant/response-messages/usersResponsesMessages.ts";
import { HTTPException } from "hono/http-exception";

export class UsersController {
    constructor(
        private readonly usersService: UsersService,
    ) { }

    async getUserData(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const user = await this.usersService.getUserData(userEmail)

        if (user) {
            return c.json({ result: user })
        }

        return c.json({ error: authResponsesMessages.noUser }, 404)
    }

    async updateUserData(c: Context<{ Variables: { userEmail: string } }, never, { out: { form: UpdateUserData } }>) {
        const updateData = c.req.valid("form");
        const userEmail = c.get("userEmail");

        if (!Object.keys(updateData).length) {
            return c.json({ error: usersResponsesMessages.noUpdateData }, 400)
        }

        const result = await this.usersService.update(userEmail, updateData);
        if (result) {
            return c.json({ result: usersResponsesMessages.successfulUpdate })
        }

        return c.json({ error: usersResponsesMessages.failedUpdate }, 400)
    }

    async deleteAccount(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const result = await this.usersService.delete(userEmail);

        if (result) {
            return c.json({ result: true })
        }

        throw new HTTPException(400, { message: usersResponsesMessages.unexpectedDeleteAccountError })
    }
}
