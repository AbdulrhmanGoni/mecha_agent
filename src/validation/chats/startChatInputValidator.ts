import { z } from 'zod';
import { Context } from "hono";
import schemaParser from "../../helpers/schemaParser.ts";
import { Next } from "hono/types";
import agentIdValidator from "../agents/agentIdValidator.ts";

const startChatInputSchema = z.object({
    prompt: z.string().min(1),
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
