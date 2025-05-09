import { DatabaseService } from "./DatabaseService.ts";
import { LLMService } from "./LLMService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";
import contextTemplate from "../helpers/contextTemplate.ts";
import systemMessageTemplate from "../helpers/systemMessageTemplate.ts";
import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";

export class ChatsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly vectorDatabaseService: VectorDatabaseService,
        private readonly llmService: LLMService,
        private readonly kvStoreClient: Deno.Kv,
    ) {
        this.kvStoreClient.listenQueue((msg) => {
            if (msg.task === "delete-expired-anonymous-chats") {
                this.databaseService.query(
                    `DELETE FROM anonymous_chats WHERE (started_at + INTERVAL '1 day') < NOW()`
                ).then(({ rowCount }) => {
                    console.log("'delete-expired-anonymous-chats' task done, deleted rows:", rowCount)
                })
            }
        });
    }

    async fetchInstructions({ agentId, prompt, userEmail }: Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail">) {
        const { rows: [agentRow] } = await this.databaseService.query<Agent | null>({
            text: `SELECT * FROM agents WHERE id = $1 AND (is_published = true OR user_email = $2)`,
            args: [agentId, userEmail],
            camelCase: true,
        })

        if (!agentRow?.datasetId) {
            return chatsResponsesMessages.noDataset
        }

        const searchResult = await this.vectorDatabaseService.search({
            text: prompt,
            datasetId: agentRow.datasetId,
            userEmail: agentRow.isPublished ? agentRow.userEmail : userEmail,
        });

        if (!searchResult.length) {
            return agentRow.dontKnowResponse || chatsResponsesMessages.dontKnow
        }

        return {
            instructions: searchResult,
            agent: agentRow,
        }
    }

    async chat(
        { agent, instructions, chatMessages, onResponseComplete }:
            Pick<ChatRelatedTypes, "chatMessages" | "onResponseComplete"> & { instructions: Instruction[], agent: Agent }
    ) {
        const systemMessage = systemMessageTemplate(agent);
        const context = contextTemplate(instructions);

        const llmResponse = await this.llmService.chat(
            [
                {
                    role: "system",
                    content: systemMessage + "\n\n" + context,
                },
                ...chatMessages,
            ],
            { onResponseComplete }
        )

        return llmResponse
    }

    async startChat(
        { agentId, prompt, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail" | "isAnonymous">
    ) {
        const result = await this.fetchInstructions({ agentId, prompt, userEmail });

        if (typeof result === "string") {
            return result
        }

        const chatId = crypto.randomUUID();

        const newMessage = {
            role: "user",
            content: prompt,
        }

        const chatResponse = await this.chat({
            agent: result.agent,
            instructions: result.instructions,
            chatMessages: [newMessage],
            onResponseComplete: async (fullResponseText) => {
                const chatHistory = [
                    newMessage,
                    {
                        role: "agent",
                        content: fullResponseText,
                    }
                ]
                await this.createChat({
                    chatId,
                    agentId,
                    chatMessages: chatHistory,
                    userEmail,
                    isAnonymous,
                })
            }
        })

        return {
            chatId,
            chatResponse
        }
    }

    async continueChat(
        { chatId, prompt, agentId, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail" | "chatId" | "isAnonymous">
    ) {
        const result = await this.fetchInstructions({ agentId, prompt, userEmail });

        if (typeof result === "string") {
            return result
        }

        const newMessage = {
            role: "user",
            content: prompt,
        }

        const chatHistory = await this.getChatMessages({ agentId, chatId, userEmail, isAnonymous });

        return this.chat({
            agent: result.agent,
            instructions: result.instructions,
            chatMessages: [...chatHistory, newMessage],
            onResponseComplete: async (fullResponseText) => {
                const newMessages = [
                    newMessage,
                    {
                        role: "agent",
                        content: fullResponseText,
                    }
                ]
                await this.appendMessageToChat({ chatId, chatMessages: newMessages, userEmail, isAnonymous })
            }
        })
    }

    async createChat(
        { agentId, chatId, chatMessages, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "chatMessages" | "agentId" | "userEmail" | "chatId" | "isAnonymous">
    ) {
        const firstPromptBegenning = chatMessages[0].content.slice(0, 40);

        const fields = '(id, agent_id, title, user_email, messages)';
        const values = '($1, $2, $3, $4, $5)';

        await this.databaseService.query<ChatHistory | undefined>({
            text: isAnonymous ?
                `INSERT INTO anonymous_chats ${fields} VALUES ${values}` : `INSERT INTO chats ${fields} VALUES ${values}`,
            args: [chatId, agentId, firstPromptBegenning, userEmail, JSON.stringify(chatMessages)],
            camelCase: true,
        })
    }

    async getChatMessages(
        { agentId, chatId, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "agentId" | "userEmail" | "chatId" | "isAnonymous">
    ) {
        const query = isAnonymous ?
            `SELECT messages FROM anonymous_chats WHERE id = $1 AND agent_id = $2 AND user_email = $3`
            : `SELECT messages FROM chats WHERE id = $1 AND agent_id = $2 AND user_email = $3`

        const { rows: [chatHistory] } = await this.databaseService.query<ChatHistory | undefined>({
            text: query,
            args: [chatId, agentId, userEmail],
            camelCase: true,
        })

        return chatHistory?.messages || []
    }

    async getChats({ agentId, userEmail }: Pick<ChatRelatedTypes, "agentId" | "userEmail">) {
        const { rows } = await this.databaseService.query<ChatHistory | undefined>({
            text: `SELECT id, agent_id, title, started_at FROM chats WHERE agent_id = $1 AND user_email = $2`,
            args: [agentId, userEmail],
            camelCase: true,
        })

        return rows
    }

    async appendMessageToChat(
        { chatId, chatMessages, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "chatId" | "chatMessages" | "userEmail" | "isAnonymous">
    ) {
        const query = isAnonymous ?
            `UPDATE anonymous_chats SET messages = messages || $3::JSONB WHERE id = $1 AND user_email = $2`
            : `UPDATE chats SET messages = messages || $3::JSONB WHERE id = $1 AND user_email = $2`

        const { rows: [chatHistory] } = await this.databaseService.query<ChatHistory | undefined>({
            text: query,
            args: [chatId, userEmail, JSON.stringify(chatMessages)],
            camelCase: true,
        })
        return chatHistory
    }

    async deleteChat(
        { chatId, agentId, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "chatId" | "agentId" | "userEmail" | "isAnonymous">
    ) {
        const query = isAnonymous ?
            'DELETE FROM anonymous_chats WHERE id = $1 AND agent_id = $2 AND user_email = $3'
            : 'DELETE FROM chats WHERE id = $1 AND agent_id = $2 AND user_email = $3'

        const { rowCount } = await this.databaseService.query<ChatHistory | undefined>({
            text: query,
            args: [chatId, agentId, userEmail],
            camelCase: true,
        })
        return !!rowCount
    }
}

Deno.cron("Delete expired anonymous chats", "0 */12 * * *", () => {
    kvStoreClient.enqueue({ task: "delete-expired-anonymous-chats" });
});