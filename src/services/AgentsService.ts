import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";

const agentRowFieldsNamesMap: Record<string, string> = {
    agentName: "agent_name",
    systemInstructions: "system_instructions",
    datasetId: "dataset_id",
    dontKnowResponse: "dont_know_response",
    responseSyntax: "response_syntax",
    greetingMessage: "greeting_message",
}

export class AgentsService {
    constructor(
        private databaseService: DatabaseService,
        private objectStorageService: ObjectStorageService,
    ) { }

    async create(newAgent: CreateAgentFormData) {
        const { avatar, ...agentData } = newAgent

        let avatarId = null;

        if (avatar) {
            const fileExtention = mimeTypeToFileExtentionMap[avatar.type];
            avatarId = `${crypto.randomUUID()}.${fileExtention}`;
        }

        type CreationDataFormat = [string, string, string[]];

        const [fields, placeholders, values] = Object
            .entries({ ...agentData, avatar: avatarId })
            .reduce<CreationDataFormat>(([fields, placeholders, values], [field, value], i, arr) => {
                return [
                    (
                        fields +
                        `${agentRowFieldsNamesMap[field] || field}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    (
                        `${placeholders}$${i + 1}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value || ""]
                ]
            }, ["", "", []])

        const transaction = this.databaseService.createTransaction("creating_agent")
        await transaction.begin();

        const result = await transaction.queryObject(`
            INSERT INTO agents (${fields})
            VALUES (${placeholders});
        `, values)

        if (result.rowCount) {
            if (newAgent.avatar && avatarId) {
                try {
                    await this.objectStorageService.uploadFile(
                        this.objectStorageService.buckets.agentsAvatars,
                        newAgent.avatar,
                        { id: avatarId }
                    );
                } catch {
                    await transaction.rollback();
                    return false;
                }
            }

            await transaction.commit();
            return true;
        }

        await transaction.rollback();
        return false;
    }

    async getOne(id: string) {
        const result = await this.databaseService.query<Agent>({
            text: "SELECT * FROM agents WHERE id = $1;",
            args: [id],
            camelCase: true,
        })
        return result.rows[0]
    }

    async getAll() {
        const result = await this.databaseService.query<Agent>({
            text: "SELECT * FROM agents",
            camelCase: true
        })
        return result.rows
    }

    async delete(agentId: string) {
        const { rows: [agent] } = await this.databaseService.query<Agent | null>({
            text: "SELECT avatar FROM agents WHERE id = $1;",
            args: [agentId],
            camelCase: true,
        })

        if (!agent) {
            return false
        }

        const transaction = this.databaseService.createTransaction("deleting_agent")
        await transaction.begin();

        const result = await transaction.queryObject<Agent>({
            text: "DELETE FROM agents WHERE id = $1;",
            args: [agentId],
            camelCase: true,
        })

        if (agent.avatar) {
            try {
                await this.objectStorageService.deleteFile(
                    this.objectStorageService.buckets.agentsAvatars,
                    agent.avatar
                )
            } catch {
                await transaction.rollback();
                return false
            }
        }

        await transaction.commit();
        return !!result.rowCount
    }

    async update(agentId: string, updateData: UpdateAgentFormData) {
        const { rows: [agent] } = await this.databaseService.query<Agent | null>({
            text: "SELECT avatar FROM agents WHERE id = $1;",
            args: [agentId],
            camelCase: true,
        })

        if (!agent) {
            return false
        }

        const { avatar: newAgentAvatart, removeAvatar, ...restUpdateData } = updateData;

        let avatarId = null;

        if (newAgentAvatart) {
            const fileExtention = mimeTypeToFileExtentionMap[newAgentAvatart.type];
            avatarId = `${crypto.randomUUID()}.${fileExtention}`;
        }

        type UpdateDataFormat = [string, string[]]

        const [fields, values] = Object
            .entries(newAgentAvatart || removeAvatar ? { ...restUpdateData, avatar: avatarId } : restUpdateData)
            .reduce<UpdateDataFormat>(([fields, values], [field, value], i, arr) => {
                return [
                    (
                        fields +
                        `${agentRowFieldsNamesMap[field] || field} = $${i + 2}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value || ""]
                ]
            }, ["", []])

        const transaction = this.databaseService.createTransaction("updating_agent")
        await transaction.begin();

        const result = await transaction.queryObject<Agent>({
            text: `UPDATE agents SET ${fields} WHERE id = $1;`,
            args: [agentId, ...values],
            camelCase: true,
        })

        try {
            if (result.rowCount) {
                if (newAgentAvatart && avatarId) {
                    await this.objectStorageService.uploadFile(
                        this.objectStorageService.buckets.agentsAvatars,
                        newAgentAvatart,
                        { id: avatarId }
                    );
                }

                if (agent.avatar && (newAgentAvatart || removeAvatar)) {
                    await this.objectStorageService.deleteFile(
                        this.objectStorageService.buckets.agentsAvatars,
                        agent.avatar
                    )
                }

                await transaction.commit();
                return true
            }
        } catch {
            await transaction.rollback()
        }

        return false
    }
}
