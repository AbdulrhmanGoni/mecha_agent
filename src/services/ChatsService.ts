import { DatabaseService } from "./DatabaseService.ts";
import { LLMService } from "./LLMService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import chatResponseHandler from "../helpers/chatResponseHandler.ts";
import contextTemplete from "../helpers/contextTemplete.ts";
import systemMessageTemplete from "../helpers/systemMessageTemplete.ts";

export class ChatsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly vectorDatabaseService: VectorDatabaseService,
        private readonly llmService: LLMService,
    ) { }

    async fetchInstructions({ agentId, prompt }: Pick<ChatRelatedTypes, "prompt" | "agentId">) {
        const { rows: [agentRow] } = await this.databaseService.query<Agent>({
            text: `SELECT * FROM agents WHERE id = $1`,
            args: [agentId],
            camelCase: true,
        })

        if (!agentRow.datasetId) {
            return `Sorry!, I don't have a dataset to answer based on.`
        }

        const searchResult = await this.vectorDatabaseService.search(
            agentRow.datasetId,
            prompt
        );

        if (!searchResult.length) {
            return agentRow.dontKnowResponse || parsedEnvVariables.DEFAULT_DONT_KNOW_RESPONSE
        }

        return {
            instructions: searchResult,
            agent: agentRow,
        }
    }

    async chat({ prompt, agentId, chatMessages, onResponseComplete }: Pick<ChatRelatedTypes, "prompt" | "agentId" | "chatMessages" | "onResponseComplete">) {
        const result = await this.fetchInstructions({ agentId, prompt });

        if (typeof result === "string") {
            return result
        }

        const systemMessage = systemMessageTemplete(result.agent);
        const context = contextTemplete(result.instructions);

        const llmResponse = await this.llmService.chat(
            [
                {
                    role: "system",
                    content: systemMessage + "\n\n" + context,
                },
                ...chatMessages,
            ],
        )

        return chatResponseHandler({
            llmResponse,
            onResponseComplete,
        })
    }

    async createChat({ agentId, chatId, chatMessages, user }: Pick<ChatRelatedTypes, "chatMessages" | "agentId" | "user" | "chatId">) {
        const firstPromptBegenning = chatMessages[0].content.slice(0, 40)
        await this.databaseService.query<ChatHistory | undefined>({
            text: `INSERT INTO chats_history (id, agent_id, title, username, messages) VALUES ($1, $2, $3, $4, $5);`,
            args: [chatId, agentId, firstPromptBegenning, user, JSON.stringify(chatMessages)],
            camelCase: true,
        })
    }

    async getChatMessages({ agentId, chatId, user }: Pick<ChatRelatedTypes, "agentId" | "user" | "chatId">) {
        const { rows: [chatHistory] } = await this.databaseService.query<ChatHistory | undefined>({
            text: `SELECT messages FROM chats_history WHERE id = $1 AND agent_id = $2 AND username = $3`,
            args: [chatId, agentId, user],
            camelCase: true,
        })

        return chatHistory?.messages || []
    }

    async getChats({ agentId, user }: Pick<ChatRelatedTypes, "agentId" | "user">) {
        const { rows } = await this.databaseService.query<ChatHistory | undefined>({
            text: `SELECT id, agent_id, title, started_at FROM chats_history WHERE agent_id = $1 AND username = $2`,
            args: [agentId, user],
            camelCase: true,
        })

        return rows
    }

    async appendMessageToChat({ chatId, chatMessages }: Pick<ChatRelatedTypes, "chatId" | "chatMessages">) {
        const { rows: [chatHistory] } = await this.databaseService.query<ChatHistory | undefined>({
            text: `UPDATE chats_history SET messages = messages || $2::JSONB WHERE id = $1`,
            args: [chatId, JSON.stringify(chatMessages)],
            camelCase: true,
        })
        return chatHistory
    }

    async deleteChat({ chatId, agentId, user }: Pick<ChatRelatedTypes, "chatId" | "agentId" | "user">) {
        const { rowCount } = await this.databaseService.query<ChatHistory | undefined>({
            text: `DELETE FROM chats_history WHERE id = $1 AND agent_id = $2 AND username = $3`,
            args: [chatId, agentId, user],
            camelCase: true,
        })
        return !!rowCount
    }
}
