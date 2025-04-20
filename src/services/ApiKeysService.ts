import { plans } from "../constant/plans.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { JwtService } from "./JwtService.ts";

export class ApiKeysService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService
    ) { }

    async create(params: CreateApiKeyInput) {
        const { keyName, ...restParams } = params
        const apiKeyId = crypto.randomUUID()
        const jwtKey = await this.jwtService.generateJwt(restParams, { apiKeyId });

        const { rows: [user] } = await this.databaseService.query<Pick<User, "apiKeysCount" | "currentPlan">>({
            text: 'SELECT api_keys_count, current_plan FROM users WHERE email = $1',
            camelCase: true,
            args: [params.userEmail],
        });

        const plan = plans.find((p) => p.planName === user.currentPlan) || plans[0]

        if (!(user.apiKeysCount < plan.maxApiKeysCount)) {
            return {
                success: false,
                limitReached: true,
            }
        }

        const transaction = this.databaseService.createTransaction("create_api_key");
        await transaction.begin();

        const result = await transaction.queryObject<ApiKeyRecord>({
            text: `
                INSERT INTO api_keys (id, key, key_name, expiration_date, permissions, user_email)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `,
            camelCase: true,
            args: [
                apiKeyId,
                jwtKey.jwt,
                keyName,
                jwtKey.expirationDate,
                params.permissions,
                params.userEmail
            ],
        });

        if (result.rows[0]) {
            const updateUserResult = await transaction.queryObject<Pick<User, "email">>({
                text: 'UPDATE users SET api_keys_count = api_keys_count + 1 WHERE email = $1',
                args: [params.userEmail],
            });

            if (updateUserResult.rowCount === 1) {
                await transaction.commit();
                return {
                    success: true,
                    result: result.rows[0]
                }
            }
        }

        await transaction.rollback();

        return {
            success: false,
        }
    }

    async getAll(userEmail: string) {
        const result = await this.databaseService.query<ApiKeyRecord>({
            text: "SELECT * FROM api_keys WHERE user_email = $1",
            camelCase: true,
            args: [userEmail]
        })
        return result.rows
    }

    async getOne(userEmail: string, id: string) {
        const result = await this.databaseService.query<ApiKeyRecord>({
            text: "SELECT * FROM api_keys WHERE id = $1 AND user_email = $2",
            args: [id, userEmail],
            camelCase: true,
        })

        return result.rows[0]
    }

    async delete(userEmail: string, keysIds: string[]) {
        const transaction = this.databaseService.createTransaction("delete_api_key");
        await transaction.begin();

        const result = await transaction.queryObject<ApiKeyRecord>({
            text: "DELETE FROM api_keys WHERE id = ANY($1) AND user_email = $2",
            args: [keysIds, userEmail],
        })

        if (result.rowCount) {
            const updateUserResult = await transaction.queryObject<Pick<User, "email">>({
                text: 'UPDATE users SET api_keys_count = api_keys_count - $2 WHERE email = $1',
                args: [userEmail, keysIds.length],
            });

            if (updateUserResult.rowCount === 1) {
                await transaction.commit();
                return true
            }
        }

        await transaction.rollback();
        return false
    }

    async deactivate(userEmail: string, keysIds: string[]) {
        const result = await this.databaseService.query({
            text: "UPDATE api_keys SET status = $2 WHERE id = ANY($1) AND user_email = $3",
            args: [keysIds, "Inactive", userEmail],
        })

        return !!result.rowCount
    }

    async activate(userEmail: string, keysIds: string[]) {
        const result = await this.databaseService.query({
            text: "UPDATE api_keys SET status = $2 WHERE id = ANY($1) AND user_email = $3",
            args: [keysIds, "Active", userEmail],
        })

        return !!result.rowCount
    }
}
