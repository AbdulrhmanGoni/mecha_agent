import { DatabaseService } from "./DatabaseService.ts";
import { LLMService } from "./LLMService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";
import chatsResponsesMessages from "../constant/response-messages/chatsResponsesMessages.ts";
import contextTemplate from "../helpers/contextTemplate.ts";
import systemMessageTemplate from "../helpers/systemMessageTemplate.ts";

export class ChatsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly vectorDatabaseService: VectorDatabaseService,
        private readonly llmService: LLMService,
    ) { }

    async fetchInstructions({ agentId, prompt, userEmail }: Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail">) {
        const { rows: [agentRow] } = await this.databaseService.query<Agent>({
            text: `SELECT * FROM agents WHERE id = $1 AND user_email = $2`,
            args: [agentId, userEmail],
            camelCase: true,
        })

        if (!agentRow.datasetId) {
            return chatsResponsesMessages.noDataset
        }

        const searchResult = await this.vectorDatabaseService.search(
            { text: prompt, datasetId: agentRow.datasetId, userEmail }
        );

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

    async startChat({ agentId, prompt, userEmail }: Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail">) {
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
                    userEmail
                })
            }
        })

        return {
            chatId,
            chatResponse
        }
    }

    async continueChat({ chatId, prompt, agentId, userEmail }: Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail" | "chatId">) {
        const result = await this.fetchInstructions({ agentId, prompt, userEmail });

        if (typeof result === "string") {
            return result
        }

        const newMessage = {
            role: "user",
            content: prompt,
        }

        const chatHistory = await this.getChatMessages({ agentId, chatId, userEmail });

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
                await this.appendMessageToChat({ chatId, chatMessages: newMessages, userEmail })
            }
        })
    }

    async createChat(
        { agentId, chatId, chatMessages, userEmail }:
            Pick<ChatRelatedTypes, "chatMessages" | "agentId" | "userEmail" | "chatId">
    ) {
        const firstPromptBegenning = chatMessages[0].content.slice(0, 40)
        await this.databaseService.query<ChatHistory | undefined>({
            text: `
                INSERT INTO 
                chats (id, agent_id, title, user_email, messages) 
                VALUES ($1, $2, $3, $4, $5);
            `,
            args: [chatId, agentId, firstPromptBegenning, userEmail, JSON.stringify(chatMessages)],
            camelCase: true,
        })
    }

    async getChatMessages({ agentId, chatId, userEmail }: Pick<ChatRelatedTypes, "agentId" | "userEmail" | "chatId">) {
        const { rows: [chatHistory] } = await this.databaseService.query<ChatHistory | undefined>({
            text: `SELECT messages FROM chats WHERE id = $1 AND agent_id = $2 AND user_email = $3`,
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
        { chatId, chatMessages, userEmail }:
            Pick<ChatRelatedTypes, "chatId" | "chatMessages" | "userEmail">
    ) {
        const { rows: [chatHistory] } = await this.databaseService.query<ChatHistory | undefined>({
            text: `UPDATE chats SET messages = messages || $3::JSONB WHERE id = $1 AND user_email = $2`,
            args: [chatId, userEmail, JSON.stringify(chatMessages)],
            camelCase: true,
        })
        return chatHistory
    }

    async deleteChat({ chatId, agentId, userEmail }: Pick<ChatRelatedTypes, "chatId" | "agentId" | "userEmail">) {
        const { rowCount } = await this.databaseService.query<ChatHistory | undefined>({
            text: `DELETE FROM chats WHERE id = $1 AND agent_id = $2 AND user_email = $3`,
            args: [chatId, agentId, userEmail],
            camelCase: true,
        })
        return !!rowCount
    }
}
