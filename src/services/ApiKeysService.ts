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

        const result = await this.databaseService.query<ApiKeyRecord>({
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

        return result.rows[0]
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
        const result = await this.databaseService.query<ApiKeyRecord>({
            text: "DELETE FROM api_keys WHERE id = ANY($1) AND user_email = $2",
            args: [keysIds, userEmail],
        })

        return !!result.rowCount
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
