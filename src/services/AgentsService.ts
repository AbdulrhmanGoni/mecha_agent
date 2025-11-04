import { plans } from "../constant/plans.ts";
import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { SubscriptionsService } from "./SubscriptionsService.ts";

const agentRowFieldsNamesMap: Record<string, string> = {
    agentName: "agent_name",
    userEmail: "user_email",
    systemInstructions: "system_instructions",
    datasetId: "dataset_id",
    dontKnowResponse: "dont_know_response",
    responseSyntax: "response_syntax",
    greetingMessage: "greeting_message",
    isPublished: "is_published",
}

export class AgentsService {
    constructor(
        private databaseService: DatabaseService,
        private objectStorageService: ObjectStorageService,
        private kvStore: Deno.Kv,
        private readonly subscriptionsService: SubscriptionsService,
    ) { }

    async create(userEmail: string, newAgent: CreateAgentFormData) {
        const { avatar, ...agentData } = newAgent

        let avatarId = null;

        if (avatar) {
            const fileExtention = mimeTypeToFileExtentionMap[avatar.type];
            avatarId = `${crypto.randomUUID()}.${fileExtention}`;
        }

        type CreationDataFormat = [string, string, (string | boolean | null)[]];

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
                    [...values, value ?? null]
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
                    return false
                }
            }

            await transaction.commit();
            return true
        }

        await transaction.rollback().catch(() => null);
        return false
    }

    async getOne(id: string, userEmail: string) {
        const result = await this.databaseService.query<Agent>({
            text: 'SELECT * FROM agents WHERE id = $1 AND user_email = $2;',
            args: [id, userEmail],
            camelCase: true,
        })
        return result.rows[0]
    }

    async getAll(userEmail: string) {
        const result = await this.databaseService.query<Agent>({
            text: 'SELECT * FROM agents WHERE user_email = $1;',
            camelCase: true,
            args: [userEmail]
        })
        return result.rows
    }

    async getPublishedAgent(id: string) {
        const result = await this.databaseService.query<Agent>({
            text: `
                SELECT id, agent_name, description, avatar, user_email, greeting_message
                FROM agents WHERE id = $1 AND is_published = true;
            `,
            args: [id],
            camelCase: true,
        })

        return result.rows[0]
    }

    async delete(agentId: string, userEmail: string) {
        const transaction = this.databaseService.createTransaction("deleting_agent")
        await transaction.begin();

        const { rowCount: deleted, rows: [deletedAgent] } = await transaction.queryObject<Pick<Agent, "isPublished" | "avatar">>({
            text: "DELETE FROM agents WHERE id = $1 AND user_email = $2 RETURNING is_published, avatar;",
            args: [agentId, userEmail],
        })

        if (!deleted) {
            await transaction.rollback();
            return false
        }

        const { rowCount: updateUserResult } = await transaction.queryObject<Pick<User, "email">>({
            text: `
            UPDATE users SET agents_count = agents_count - 1, published_agents = published_agents - $2 
            WHERE email = $1
            `,
            args: [userEmail, deletedAgent.isPublished ? 1 : 0],
        });

        if (!updateUserResult) {
            await transaction.rollback();
            return false
        }

        await transaction.commit();

        if (deletedAgent.avatar) {
            const aSecond = 1000
            this.kvStore.enqueue({ task: "delete_agents_avatars_from_S3" }, {
                delay: aSecond * 15,
                backoffSchedule: [aSecond * 5, aSecond * 10, aSecond * 15],
            });
        }

        return true
    }

    async update(agentId: string, userEmail: string, updateData: UpdateAgentFormData) {
        const { rows: [agent] } = await this.databaseService.query<Agent | null>({
            text: "SELECT avatar FROM agents WHERE id = $1 AND user_email = $2;",
            args: [agentId, userEmail],
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

        type UpdateDataFormat = [string, (string | boolean | null)[]]

        const [fields, values] = Object
            .entries(newAgentAvatart || removeAvatar ? { ...restUpdateData, avatar: avatarId } : restUpdateData)
            .reduce<UpdateDataFormat>(([fields, values], [field, value], i, arr) => {
                return [
                    (
                        fields +
                        `${agentRowFieldsNamesMap[field] || field} = $${i + 3}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value ?? null]
                ]
            }, ["", []])

        const transaction = this.databaseService.createTransaction("updating_agent")
        await transaction.begin();

        const result = await transaction.queryObject<Agent>({
            text: `UPDATE agents SET ${fields} WHERE id = $1 AND user_email = $2;`,
            args: [agentId, userEmail, ...values],
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

    async setDataset(params: { agentId: string, userEmail: string, datasetId: string, action: string }) {
        const { rowCount: agentUpdated } = await this.databaseService.query<Agent>({
            text: 'UPDATE agents SET dataset_id = $3 WHERE id = $1 AND user_email = $2',
            args: [
                params.agentId,
                params.userEmail,
                params.action == "unassociate" ? null : params.datasetId,
            ],
        })

        return !!agentUpdated
    }

    async updateAgentPublishingState(agentId: string, userEmail: string, isPublished: boolean) {
        const transaction = this.databaseService.createTransaction(isPublished ? "unpublish_agent" : "publish_agent")
        await transaction.begin();

        const { rowCount: agentUpdated } = await transaction.queryObject<Agent>({
            text: 'UPDATE agents SET is_published = $3 WHERE id = $1 AND user_email = $2',
            args: [agentId, userEmail, !isPublished],
        })

        const { rowCount: userUpdated } = await transaction.queryObject<Agent>({
            text: 'UPDATE users SET published_agents = published_agents + $2 WHERE email = $1',
            args: [userEmail, isPublished ? -1 : 1],
        })

        if (!!userUpdated && !!agentUpdated) {
            const publishedAgentRecordKey = ["published_agent_owner", agentId]
            if (isPublished) {
                await this.kvStore.delete(publishedAgentRecordKey)
            } else {
                await this.kvStore.set(publishedAgentRecordKey, userEmail)
            }

            await transaction.commit()
            return true
        }

        await transaction.rollback()
        return false
    }

    async publishAgent(agentId: string, userEmail: string) {
        const userSubscription = await this.subscriptionsService.getUserSubscriptionData(userEmail)
        if (!userSubscription) {
            return {
                success: false,
            }
        }

        const { rows: [user] } = await this.databaseService.query<Pick<User, "publishedAgents" | "currentPlan"> | null>({
            text: 'SELECT published_agents FROM users WHERE email = $1',
            camelCase: true,
            args: [userEmail],
        });

        if (!user) {
            return {
                success: false,
            }
        }

        const plan = plans.find((p) => p.planName == userSubscription.planName) || plans[0]

        if (!(user.publishedAgents < plan.maxPublishedAgentsCount)) {
            return {
                success: false,
                limitReached: true,
            }
        }

        const result = await this.updateAgentPublishingState(agentId, userEmail, false)

        return {
            success: result,
        }
    }
}
