import { z } from 'npm:zod';
import { Context } from "npm:hono";
import schemaParser from "../../helpers/schemaParser.ts";
import { Next } from "npm:hono/types";
import agentIdValidator from "../agents/agentIdValidator.ts";

const startChatInputSchema = z.object({
    prompt: z.string(),
    agentId: agentIdValidator
}).strict();

export default async function startChatInputValidator(c: Context, next: Next) {
    const agentId = c.req.query("agentId");
    const { prompt } = await c.req.json();

    const result = schemaParser<typeof startChatInputSchema.shape, string | undefined>(
        c,
        startChatInputSchema,
        { prompt, agentId }
    )

    if (result instanceof Response) {
        return result
    }

    await next()
};
