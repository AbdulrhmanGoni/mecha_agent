import { plans } from "../constant/plans.ts";
import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";

const agentRowFieldsNamesMap: Record<string, string> = {
    agentName: "agent_name",
    userEmail: "user_email",
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
        private datasetProcessingWorker: Worker,
    ) { }

    async create(userEmail: string, newAgent: CreateAgentFormData) {
        const { rows: [user] } = await this.databaseService.query<Pick<User, "agentsCount" | "currentPlan"> | null>({
            text: 'SELECT agents_count, current_plan FROM users WHERE email = $1',
            camelCase: true,
            args: [userEmail],
        });

        if (!user) {
            return {
                success: false,
            }
        }

        const plan = plans.find((p) => p.planName === user.currentPlan) || plans[0]

        if (!(user.agentsCount < plan.maxAgentsCount)) {
            return {
                success: false,
                limitReached: true,
            }
        }

        const { avatar, ...agentData } = newAgent

        let avatarId = null;

        if (avatar) {
            const fileExtention = mimeTypeToFileExtentionMap[avatar.type];
            avatarId = `${crypto.randomUUID()}.${fileExtention}`;
        }

        type CreationDataFormat = [string, string, string[]];

        const [fields, placeholders, values] = Object
            .entries({ ...agentData, userEmail, avatar: avatarId })
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
        `, values).catch(() => null);

        const updateUserResult = await transaction.queryObject<Pick<User, "email">>({
            text: 'UPDATE users SET agents_count = agents_count + 1 WHERE email = $1',
            args: [userEmail],
        });

        if (result?.rowCount && updateUserResult.rowCount) {
            if (newAgent.avatar && avatarId) {
                try {
                    await this.objectStorageService.uploadFile(
                        this.objectStorageService.buckets.agentsAvatars,
                        newAgent.avatar,
                        { id: avatarId, metaData: { "user-email": userEmail } }
                    );
                } catch {
                    await transaction.rollback();
                    return {
                        success: false,
                    }
                }
            }

            await transaction.commit();
            return {
                success: true,
            }
        }

        await transaction.rollback().catch(() => null);
        return {
            success: false,
        }
    }

    async getOne(id: string, userEmail: string) {
        const result = await this.databaseService.query<Agent>({
            text: `
                SELECT 
                    agents.*,
                    CASE 
                        WHEN datasets.id IS NOT NULL THEN
                            json_build_object(
                                'id', datasets.id, 
                                'title', datasets.title, 
                                'description', datasets.description,
                                'status', datasets.status
                            )
                        ELSE NULL 
                    END AS dataset 
                FROM agents LEFT JOIN datasets ON agents.id = datasets.agent_id 
                WHERE agents.id = $1 AND agents.user_email = $2;
            `,
            args: [id, userEmail],
            camelCase: true,
        })
        return result.rows[0]
    }

    async getAll(userEmail: string) {
        const result = await this.databaseService.query<Agent>({
            text: `
            SELECT 
                agents.*,
                CASE 
                    WHEN datasets.id IS NOT NULL THEN
                        json_build_object(
                            'id', datasets.id, 
                            'title', datasets.title, 
                            'description', datasets.description,
                            'status', datasets.status
                        )
                    ELSE NULL 
                END AS dataset 
            FROM agents LEFT JOIN datasets ON agents.id = datasets.agent_id
            WHERE agents.user_email = $1
        `,
            camelCase: true,
            args: [userEmail]
        })
        return result.rows
    }

    async delete(agentId: string, userEmail: string) {
        const { rows: [agent] } = await this.databaseService.query<Pick<Agent, "avatar" | "datasetId"> | null>({
            text: "SELECT avatar, dataset_id FROM agents WHERE id = $1 AND user_email = $2;",
            args: [agentId, userEmail],
            camelCase: true,
        })

        if (!agent) {
            return null
        }

        const transaction = this.databaseService.createTransaction("deleting_agent")
        await transaction.begin();

        const result = await transaction.queryObject<Agent>({
            text: "DELETE FROM agents WHERE id = $1 AND user_email = $2;",
            args: [agentId, userEmail],
            camelCase: true,
        })

        if (result.rowCount !== 1) {
            await transaction.rollback();
            return false
        }

        const updateUserResult = await transaction.queryObject<Pick<User, "email">>({
            text: 'UPDATE users SET agents_count = agents_count - 1 WHERE email = $1',
            args: [userEmail],
        });

        if (updateUserResult.rowCount !== 1) {
            await transaction.rollback();
            return false
        }

        if (agent.datasetId) {
            this.datasetProcessingWorker.postMessage({
                process: "delete_dataset",
                payload: { userEmail, datasetId: agent.datasetId }
            });
        }

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
        return true
    }

    async update(agentId: string, userEmail: string, updateData: UpdateAgentFormData) {
        const { rows: [agent] } = await this.databaseService.query<Agent | null>({
            text: "SELECT avatar FROM agents WHERE id = $1 AND user_email = $2;",
            args: [agentId, userEmail],
            camelCase: true,
        })

        if (!agent) {
            return null
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
                        `${agentRowFieldsNamesMap[field] || field} = $${i + 3}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value || ""]
                ]
            }, ["", []])

        const transaction = this.databaseService.createTransaction("updating_agent")
        await transaction.begin();

        const result = await transaction.queryObject<Agent>({
            text: `UPDATE agents SET ${fields} WHERE id = $1 AND user_email = $2;`,
            args: [agentId, userEmail, ...values],
            camelCase: true,
        })

        try {
            if (result.rowCount) {
                if (newAgentAvatart && avatarId) {
                    await this.objectStorageService.uploadFile(
                        this.objectStorageService.buckets.agentsAvatars,
                        newAgentAvatart,
                        { id: avatarId, metaData: { "user-email": userEmail } }
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
