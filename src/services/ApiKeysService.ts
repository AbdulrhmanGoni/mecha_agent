import { type Client as PostgresClient } from "deno.land/x/postgres";
import { PasswordHasher } from "../helpers/passwordHasher.ts";
import genDateAfterNDays from "../helpers/genDateAfterNDays.ts";
import crypto from "node:crypto";
import generateApiKeySecret from "../helpers/generateApiKeySecret.ts";


export class ApiKeysService {
    constructor(
        private readonly dbClient: PostgresClient,
    ) { }

    private apiKeySecretLength = 46
    private apiKeyIdLength = 36

    protected formApiKey(id: string, secret: string): string {
        return `${secret}${id}`
    }

    parseApiKey(key: string): { id: string; secret: string } | null {
        if (!key || key.length < this.apiKeyIdLength + this.apiKeySecretLength) {
            return null
        }

        const secret = key.substring(0, key.length - this.apiKeyIdLength)
        const id = key.substring(key.length - this.apiKeyIdLength)

        if (id.length !== this.apiKeyIdLength) {
            return null
        }

        return { id, secret }
    }

    async create(params: CreateApiKeyInput) {
        const apiKeyId = crypto.randomUUID()
        const apiKeySecret = generateApiKeySecret()
        const apiKey = this.formApiKey(apiKeyId, apiKeySecret)

        const transaction = this.dbClient.createTransaction("create_api_key");
        await transaction.begin();

        const result = await transaction.queryObject<Omit<ApiKeyRecord, "secretHash">>({
            text: `
                INSERT INTO api_keys (id, secret_hash, key_name, expiration_date, permissions, user_email)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, key_name, expiration_date, permissions, status, created_at, user_email;
            `,
            camelCase: true,
            args: [
                apiKeyId,
                await PasswordHasher.hash(apiKeySecret),
                params.keyName,
                params.maxAgeInDays ? genDateAfterNDays(params.maxAgeInDays) : null,
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
                    key: apiKey,
                    record: result.rows[0]
                }
            }
        }

        await transaction.rollback();
        return null
    }

    InvalidApiKey = 1 as const
    InactiveApiKey = 2 as const
    InvalidApiKeySecret = 3 as const
    ExpiredApiKey = 4 as const
    InsufficientPermissions = 5 as const

    async verifyApiKey(key: string, permissions: Permission[]) {
        const parsed = this.parseApiKey(key)
        if (!parsed) {
            return this.InvalidApiKey
        }

        const { id, secret } = parsed
        const { rows: [apiKey] } = await this.dbClient.queryObject<ApiKeyRecord>({
            text: "SELECT id, expiration_date, status, permissions, secret_hash, user_email FROM api_keys WHERE id = $1",
            args: [id],
            camelCase: true,
        })

        if (!apiKey) {
            return this.InvalidApiKey
        }

        if (apiKey.expirationDate && new Date(apiKey.expirationDate) < new Date()) {
            return this.ExpiredApiKey
        }

        if (apiKey.status !== "Active") {
            return this.InactiveApiKey
        }

        if (permissions.some((permission) => !apiKey.permissions.includes(permission))) {
            return this.InsufficientPermissions
        }

        const isSecretValid = await PasswordHasher.verify(secret, apiKey.secretHash)
        if (!isSecretValid) {
            return this.InvalidApiKeySecret
        }

        return apiKey
    }

    async getAll(userEmail: string) {
        const result = await this.dbClient.queryObject<Omit<ApiKeyRecord, "secretHash">>({
            text: `
                SELECT id, key_name, expiration_date, permissions, status, created_at, user_email
                FROM api_keys 
                WHERE user_email = $1
            `,
            camelCase: true,
            args: [userEmail]
        })
        return result.rows
    }

    async delete(userEmail: string, keysIds: string[]) {
        const transaction = this.dbClient.createTransaction("delete_api_key");
        await transaction.begin();

        const result = await transaction.queryObject<ApiKeyRecord>({
            text: "DELETE FROM api_keys WHERE id = ANY($1) AND user_email = $2",
            args: [keysIds, userEmail],
        })

        if (result.rowCount) {
            const updateUserResult = await transaction.queryObject<Pick<User, "email">>({
                text: 'UPDATE users SET api_keys_count = api_keys_count - $2 WHERE email = $1',
                args: [userEmail, result.rowCount],
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
        const result = await this.dbClient.queryObject({
            text: "UPDATE api_keys SET status = $2 WHERE id = ANY($1) AND user_email = $3",
            args: [keysIds, "Inactive", userEmail],
        })

        return !!result.rowCount
    }

    async activate(userEmail: string, keysIds: string[]) {
        const result = await this.dbClient.queryObject({
            text: "UPDATE api_keys SET status = $2 WHERE id = ANY($1) AND user_email = $3",
            args: [keysIds, "Active", userEmail],
        })

        return !!result.rowCount
    }
}
