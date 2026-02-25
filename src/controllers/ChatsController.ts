import { Context } from "hono";
import { ChatsService } from "../services/ChatsService.ts";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";

export class ChatsController {
    constructor(private chatsService: ChatsService) { }

    private async startChat(c: Context, params: Pick<ChatRelatedTypes, "agentId" | "userEmail" | "isAnonymous">) {
        const body = await c.req.json();
        const { response, chatId, noDataset, noInstructions } = await this.chatsService.startChat({
            ...params,
            prompt: body.prompt,
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

        return c.body(response!, 200, { chatId: chatId || "" });
    }

    startPrivateChat(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const isAnonymous = c.req.query("anonymous") == "yes";
        const userEmail = c.get("userEmail");
        return this.startChat(c, { agentId, userEmail, isAnonymous })
    }

    startPublicChat(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const userEmail = c.get("userEmail");
        return this.startChat(c, { agentId, userEmail, isAnonymous: true })
    }

    async continueChat(c: Context, params: Pick<ChatRelatedTypes, "chatId" | "agentId" | "userEmail" | "isAnonymous">) {
        const body = await c.req.json();
        const { response, noDataset, noInstructions } = await this.chatsService.continueChat({
            ...params,
            prompt: body.prompt,
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

        return c.body(response!, 200);
    }

    continuePrivateChat(c: Context<{ Variables: { userEmail: string } }>) {
        const chatId = c.req.param("chatId");
        const agentId = c.req.query("agentId") as string;
        const isAnonymous = c.req.query("anonymous") == "yes";
        const userEmail = c.get("userEmail");
        return this.continueChat(c, { chatId, agentId, userEmail, isAnonymous })
    }

    continuePublicChat(c: Context<{ Variables: { userEmail: string, agentId: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const userEmail = c.get("userEmail");
        const chatId = c.req.param("chatId");
        return this.continueChat(c, { chatId, agentId, userEmail, isAnonymous: true })
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

    async getChatMessages(c: Context, params: Pick<ChatRelatedTypes, "chatId" | "agentId" | "userEmail" | "isAnonymous">) {
        const result = await this.chatsService.getChatMessages(params);
        if (result.length) {
            return c.json({ result }, 200);
        } else {
            return c.json({ error: chatsResponsesMessages.chatNotFound(params.chatId) }, 404);
        }
    }

    async getPrivateChatMessages(c: Context) {
        const agentId = c.req.query("agentId") as string;
        const chatId = c.req.param("chatId");
        const userEmail = c.get("userEmail");
        const isAnonymous = c.req.query("anonymous") == "yes"

        return await this.getChatMessages(c, {
            agentId,
            chatId,
            userEmail,
            isAnonymous,
        });
    }

    async getPublicChatMessages(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const chatId = c.req.param("chatId");
        const userEmail = c.get("userEmail");

        return await this.getChatMessages(c, {
            agentId,
            chatId,
            userEmail,
            isAnonymous: true,
        });
    }

    async deleteChat(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.query("agentId") as string;
        const chatId = c.req.param("chatId");
        const userEmail = c.get("userEmail");
        const isAnonymous = c.req.query("anonymous") == "yes"

        const result = await this.chatsService.deleteChat({
            agentId,
            chatId,
            userEmail,
            isAnonymous,
        });

        return c.json({ result }, 200);
    }
}
