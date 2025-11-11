import { plans } from "../constant/plans.ts";
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
        const transaction = this.databaseService.createTransaction("creating_agent")
        await transaction.begin();

        const result = await transaction.queryObject({
            text: `
                INSERT INTO agents(
                    agent_name, 
                    description, 
                    avatar, 
                    system_instructions, 
                    dont_know_response, 
                    response_syntax, 
                    greeting_message,
                    user_email
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
            `,
            args: [
                newAgent.agentName,
                newAgent.description,
                newAgent.avatar,
                newAgent.systemInstructions,
                newAgent.dontKnowResponse,
                newAgent.responseSyntax,
                newAgent.greetingMessage,
                userEmail
            ]
        })

        const updateUserResult = await transaction.queryObject<Pick<User, "email">>({
            text: 'UPDATE users SET agents_count = agents_count + 1 WHERE email = $1',
            args: [userEmail],
        });

        if (result?.rowCount && updateUserResult.rowCount) {
            await transaction.commit();
            return true
        }

        await transaction.rollback()
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
            const second = 1000
            this.kvStore.enqueue({ task: "delete_avatars_from_object_storage" }, {
                delay: second * 7,
                backoffSchedule: [second * 10, second * 60, second * 60 * 60],
            });
        }

        return true
    }

    async update(agentId: string, userEmail: string, updateData: UpdateAgentFormData) {
        const { removeAvatar, ...restUpdateData } = updateData;
        let oldAvatar: string | undefined;
        if (removeAvatar || restUpdateData.avatar) {
            const { rows: [agent] } = await this.databaseService.query<Agent>({
                text: "SELECT avatar FROM agents WHERE id = $1 AND user_email = $2;",
                args: [agentId, userEmail],
            })
            oldAvatar = agent.avatar
            removeAvatar && Object.assign(restUpdateData, { avatar: null });
        }

        type UpdateDataFormat = [string, (string | boolean | null)[]]

        const [fields, values] = Object
            .entries(restUpdateData)
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

        const updateResult = await transaction.queryObject<Agent>({
            text: `UPDATE agents SET ${fields} WHERE id = $1 AND user_email = $2;`,
            args: [agentId, userEmail, ...values],
        })

        if (updateResult.rowCount) {
            if (oldAvatar) {
                this.objectStorageService.deleteAvatars(oldAvatar);
            }
            await transaction.commit();
            return true
        }

        await transaction.rollback()
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

        const plan = plans.find((p) => p.planName == userSubscription?.planName) || plans[0]

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
