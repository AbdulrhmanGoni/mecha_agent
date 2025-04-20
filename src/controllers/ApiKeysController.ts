import { Context } from "hono";
import { ApiKeysService } from "../services/ApiKeysService.ts";
import { HTTPException } from 'hono/http-exception';
import apiKeysResponseMessages from "../constant/response-messages/apiKeysResponsesMessages.ts";

export class ApiKeysController {
    constructor(private apiKeysService: ApiKeysService) { }

    async create(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: CreateApiKeyInput } }>) {
        const body = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const { success, limitReached, result } = await this.apiKeysService.create(
            {
                keyName: body.keyName,
                maxAgeInDays: body.maxAgeInDays,
                permissions: body.permissions,
                userEmail,
            }
        );

        if (success) {
            return c.json({ result }, 201);
        }

        throw new HTTPException(400, {
            message: limitReached ? apiKeysResponseMessages.apiKeysLimitReached : apiKeysResponseMessages.failedKeyCreation
        })
    }

    async getAll(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const result = await this.apiKeysService.getAll(userEmail);
        return c.json({ result });
    }

    async delete(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: string[] } }>) {
        const keys = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const deletedSuccessfully = await this.apiKeysService.delete(userEmail, keys);

        if (deletedSuccessfully) {
            return c.json({ result: apiKeysResponseMessages.successfulKeyDeletion });
        }

        throw new HTTPException(400, { message: apiKeysResponseMessages.failedKeyDeletion })
    }

    async deactivate(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: string[] } }>) {
        const keys = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const deactivatedSuccessfully = await this.apiKeysService.deactivate(userEmail, keys);

        if (deactivatedSuccessfully) {
            return c.json({ result: apiKeysResponseMessages.successfulKeyDeactivation });
        }

        throw new HTTPException(400, { message: apiKeysResponseMessages.failedKeyDeactivation })
    }

    async activate(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: string[] } }>) {
        const keys = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const activatedSuccessfully = await this.apiKeysService.activate(userEmail, keys);

        if (activatedSuccessfully) {
            return c.json({ result: apiKeysResponseMessages.successfulKeyActivation });
        }

        throw new HTTPException(400, { message: apiKeysResponseMessages.failedKeyActivation })
    }
}
