import { Context } from "npm:hono";
import { ApiKeysService } from "../services/ApiKeysService.ts";
import { HTTPException } from 'npm:hono/http-exception';
import apiKeysResponseMessages from "../constant/response-messages/apiKeysResponsesMessages.ts";

export class ApiKeysController {
    constructor(private apiKeysService: ApiKeysService) { }

    async create(c: Context<never, never, { out: { json: CreateApiKeyInput } }>) {
        const body = c.req.valid("json");
        const newKey = await this.apiKeysService.create(
            body.keyName,
            {
                maxAgeInDays: body.maxAgeInDays,
                permissions: body.permissions,
                user: c.get("user")
            }
        );

        if (newKey) {
            return c.json({ result: newKey }, 201);
        }

        throw new HTTPException(400, { message: apiKeysResponseMessages.failedKeyCreation })
    }
}
