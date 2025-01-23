import { DatabaseService } from "./DatabaseService.ts";
import { LLMService } from "./LLMService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";

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

    async createChat({ agentId, chatId, chatMessages, user }: Pick<ChatRelatedTypes, "chatMessages" | "agentId" | "user" | "chatId">) {
        const firstPromptBegenning = chatMessages[0].content.slice(0, 40)
        await this.databaseService.query<ChatHistory | undefined>({
            text: `INSERT INTO chats_history (id, agent_id, title, username, messages) VALUES ($1, $2, $3, $4, $5);`,
            args: [chatId, agentId, firstPromptBegenning, user, JSON.stringify(chatMessages)],
            camelCase: true,
        })
    }
}
