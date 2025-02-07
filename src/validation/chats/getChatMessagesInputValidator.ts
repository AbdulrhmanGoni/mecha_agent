import { z } from 'zod';
import { Context } from "hono";
import schemaParser from "../../helpers/schemaParser.ts";
import { Next } from "hono/types";
import agentIdValidator from "../agents/agentIdValidator.ts";
import chatIdValidator from "./chatIdValidator.ts";

const getChatMessagesInputSchema = z.object({
    agentId: agentIdValidator,
    chatId: chatIdValidator,
}).strict();

export default async function getChatMessagesInputValidator(c: Context, next: Next) {
    const chatId = c.req.param("chatId");
    const agentId = c.req.query("agentId");

    const result = schemaParser<typeof getChatMessagesInputSchema.shape, string | undefined>(
        c,
        getChatMessagesInputSchema,
        { agentId, chatId }
    )

    if (result instanceof Response) {
        return result
    }

    await next()
};
