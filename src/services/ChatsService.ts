import { DatabaseService } from "./DatabaseService.ts";
import { LLMService } from "./LLMService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";
import contextTemplate from "../helpers/contextTemplate.ts";
import systemMessageTemplate from "../helpers/systemMessageTemplate.ts";

export class ChatsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly vectorDatabaseService: VectorDatabaseService,
        private readonly llmService: LLMService,
    ) { }

    async fetchInstructions(
        { agentId, prompt, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail" | "isAnonymous">
    ) {
        const { rows: [agentRow] } = await this.databaseService.query<Agent | null>({
            text: 'SELECT * FROM agents WHERE id = $1 AND user_email = $2 AND ($3 = false OR is_published = true)',
            args: [agentId, userEmail, !!isAnonymous],
            camelCase: true,
        })

        if (!agentRow?.datasetId) {
            return {
                instructions: null,
                agent: agentRow,
            }
        }

        const searchResult = await this.vectorDatabaseService.search(agentRow.datasetId, userEmail, {
            searchText: prompt,
            page: 0,
            pageSize: 15,
            forLLM: true,
        });

        return {
            instructions: searchResult,
            agent: agentRow,
        }
    }

    async chat(
        { userEmail, prompt, agentId, newMessage, onResponseComplete, isAnonymous, chatId }:
            Pick<ChatRelatedTypes, "userEmail" | "prompt" | "agentId" | "newMessage" | "onResponseComplete" | "isAnonymous" | "chatId">
    ) {
        const { agent, instructions } = await this.fetchInstructions({ agentId, prompt, userEmail, isAnonymous });

        if (!agent || !instructions || !instructions.length) {
            return {
                response: null,
                noDataset: !instructions,
                noInstructions: !instructions?.length,
            }
        }

        const chatHistory = chatId ? await this.getChatMessages({ agentId, chatId, userEmail, isAnonymous }) : [];

        const systemMessage = systemMessageTemplate(agent);
        const context = contextTemplate(instructions);

        const llmResponse = await this.llmService.chat(
            [
                {
                    role: "system",
                    content: systemMessage + "\n\n" + context,
                },
                ...chatHistory,
                newMessage,
            ],
            { onResponseComplete }
        )

        return { response: llmResponse, chatId }
    }

    startChat(
        { agentId, prompt, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail" | "isAnonymous">
    ) {
        const chatId = crypto.randomUUID();

        const newMessage = {
            role: "user",
            content: prompt,
        }

        return this.chat({
            userEmail,
            isAnonymous,
            agentId,
            chatId,
            prompt,
            newMessage,
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
    }

    continueChat(
        { chatId, prompt, agentId, userEmail, isAnonymous }:
            Pick<ChatRelatedTypes, "prompt" | "agentId" | "userEmail" | "chatId" | "isAnonymous">
    ) {
        const newMessage = {
            role: "user",
            content: prompt,
        }

        return this.chat({
            newMessage,
            userEmail,
            isAnonymous,
            agentId,
            chatId,
            prompt,
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
            'UPDATE anonymous_chats SET last_interaction = NOW(), messages = messages || $3::JSONB WHERE id = $1 AND user_email = $2'
            : 'UPDATE chats SET messages = messages || $3::JSONB WHERE id = $1 AND user_email = $2'

        const { rowCount } = await this.databaseService.query({
            text: query,
            args: [chatId, userEmail, JSON.stringify(chatMessages)],
        })

        return !!rowCount
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
        })
        return !!rowCount
    }
}
