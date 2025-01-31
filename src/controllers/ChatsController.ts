import { Context } from "npm:hono";
import { ChatsService } from "../services/ChatsService.ts";

export class ChatsController {
    constructor(private chatsService: ChatsService) { }

    async startChat(c: Context) {
        const agentId = c.req.query("agentId") as string;
        const body = await c.req.json();

        const { chatResponse, chatId } = await this.chatsService.startChat({
            agentId,
            prompt: body.prompt,
            user: c.get("user")
        });

        return c.body(chatResponse, 200, { chatId });
    }

    async continueChat(c: Context) {
        const chatId = c.req.param("chatId");
        const agentId = c.req.query("agentId") as string;
        const body = await c.req.json();

        const response = await this.chatsService.continueChat({
            agentId,
            prompt: body.prompt,
            chatId,
            user: c.get("user")
        });

        return c.body(response, 200);
    }

    async getChats(c: Context) {
        const agentId = c.req.query("agentId") as string;
        const result = await this.chatsService.getChats({
            agentId,
            user: c.get("user")
        });

        return c.json({ result }, 200);
    }

    async getChatMessages(c: Context) {
        const agentId = c.req.query("agentId") as string;
        const chatId = c.req.param("chatId");

        const result = await this.chatsService.getChatMessages({
            agentId,
            chatId,
            user: c.get("user")
        });

        return c.json({ result }, 200);
    }
}
