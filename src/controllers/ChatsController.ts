import { Context } from "hono";
import { ChatsService } from "../services/ChatsService.ts";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";

export class ChatsController {
    constructor(private chatsService: ChatsService) { }

    async startChat(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const userEmail = c.get("userEmail");
        const body = await c.req.json();

        const result = await this.chatsService.startChat({
            agentId,
            prompt: body.prompt,
            userEmail,
        });

        if (typeof result === "string") {
            return c.body(result)
        }

        return c.body(result.chatResponse, 200, { chatId: result.chatId });
    }

    async continueChat(c: Context<{ Variables: { userEmail: string } }>) {
        const chatId = c.req.param("chatId");
        const agentId = c.req.query("agentId") as string;
        const userEmail = c.get("userEmail");
        const body = await c.req.json();

        const response = await this.chatsService.continueChat({
            agentId,
            prompt: body.prompt,
            chatId,
            userEmail,
        });

        return c.body(response, 200);
    }

    async getChats(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const userEmail = c.get("userEmail");
        const result = await this.chatsService.getChats({
            agentId,
            userEmail,
        });

        return c.json({ result }, 200);
    }

    async getChatMessages(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const chatId = c.req.param("chatId");
        const userEmail = c.get("userEmail");

        const result = await this.chatsService.getChatMessages({
            agentId,
            chatId,
            userEmail,
        });

        if (result.length) {
            return c.json({ result }, 200);
        } else {
            return c.json({ error: chatsResponsesMessages.chatNotFound(chatId) }, 404);
        }
    }

    async deleteChat(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const chatId = c.req.param("chatId");
        const userEmail = c.get("userEmail");

        const result = await this.chatsService.deleteChat({
            agentId,
            chatId,
            userEmail,
        });

        return c.json({ result }, 200);
    }
}
