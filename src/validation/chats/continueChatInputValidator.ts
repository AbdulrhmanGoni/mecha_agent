import { z } from 'zod';
import { Context } from "npm:hono";
import schemaParser from "../../helpers/schemaParser.ts";
import { Next } from "npm:hono/types";
import agentIdValidator from "../agents/agentIdValidator.ts";
import chatIdValidator from "./chatIdValidator.ts";

const continueChatInputSchema = z.object({
    prompt: z.string(),
    agentId: agentIdValidator,
    chatId: chatIdValidator,
}).strict();

export default async function continueChatInputValidator(c: Context, next: Next) {
    const chatId = c.req.param("chatId");
    const agentId = c.req.query("agentId");
    const { prompt } = await c.req.json();

    const result = schemaParser<typeof continueChatInputSchema.shape, string | undefined>(
        c,
        continueChatInputSchema,
        { prompt, agentId, chatId }
    )

    if (result instanceof Response) {
        return result
    }

    await next()
};
