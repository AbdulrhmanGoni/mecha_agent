import { Context } from "hono";
import { ChatsService } from "../services/ChatsService.ts";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";

export class ChatsController {
    constructor(private chatsService: ChatsService) { }

    async startChat(c: Context<{ Variables: { userEmail: string, noInference: boolean } }>) {
        const agentId = c.req.query("agentId") as string;
        const isAnonymous = c.req.query("anonymous") === "yes";
        const userEmail = c.get("userEmail");
        const body = await c.req.json();

        const { response, chatId, noDataset, noInstructions } = await this.chatsService.startChat({
            agentId,
            prompt: body.prompt,
            userEmail,
            isAnonymous,
        });

        if (noDataset || noInstructions) {
            c.set("noInference", true)
        }

        if (noDataset) {
            return c.body(chatsResponsesMessages.noDataset);
        }

        if (noInstructions) {
            return c.body(chatsResponsesMessages.dontKnow);
        }

        return c.body(response, 200, { chatId: chatId || "" });
    }

    async continueChat(c: Context<{ Variables: { userEmail: string, noInference: boolean } }>) {
        const chatId = c.req.param("chatId");
        const agentId = c.req.query("agentId") as string;
        const isAnonymous = c.req.query("anonymous") === "yes";
        const userEmail = c.get("userEmail");
        const body = await c.req.json();

        const { response, noDataset, noInstructions } = await this.chatsService.continueChat({
            agentId,
            prompt: body.prompt,
            chatId,
            userEmail,
            isAnonymous,
        });

        if (noDataset || noInstructions) {
            c.set("noInference", true)
        }

        if (noDataset) {
            return c.body(chatsResponsesMessages.noDataset);
        }

        if (noInstructions) {
            return c.body(chatsResponsesMessages.dontKnow);
        }

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
        const isAnonymous = c.req.query("anonymous") === "yes"

        const result = await this.chatsService.getChatMessages({
            agentId,
            chatId,
            userEmail,
            isAnonymous,
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
        const isAnonymous = c.req.query("anonymous") === "yes"

        const result = await this.chatsService.deleteChat({
            agentId,
            chatId,
            userEmail,
            isAnonymous,
        });

        return c.json({ result }, 200);
    }
}
