import { z } from 'zod';
import { Context } from "npm:hono";
import schemaParser from "../../helpers/schemaParser.ts";
import { Next } from "npm:hono/types";
import agentIdValidator from "../agents/agentIdValidator.ts";
import chatIdValidator from "./chatIdValidator.ts";

const deleteChatInputSchema = z.object({
    agentId: agentIdValidator,
    chatId: chatIdValidator,
}).strict();

export default async function deleteChatInputValidator(c: Context, next: Next) {
    const chatId = c.req.param("chatId");
    const agentId = c.req.query("agentId");

    const result = schemaParser<typeof deleteChatInputSchema.shape, string | undefined>(
        c,
        deleteChatInputSchema,
        { agentId, chatId }
    )

    if (result instanceof Response) {
        return result
    }

    await next()
};
