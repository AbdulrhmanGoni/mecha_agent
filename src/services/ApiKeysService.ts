import { DatabaseService } from "./DatabaseService.ts";
import { JwtService } from "./JwtService.ts";

export class ApiKeysService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly jwtService: JwtService
    ) { }

    async create(keyName: string, options: CreateJWTOptions) {
        const jwtKey = await this.jwtService.generateJwt(options);

        const result = await this.databaseService.query<ApiKeyRecord>({
            text: `
                INSERT INTO api_keys (key, key_name, expiration_date, permissions)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `,
            camelCase: true,
            args: [jwtKey.jwt, keyName, jwtKey.expirationDate, options.permissions],
        });

        return result.rows[0]
    }

    async getAll() {
        const result = await this.databaseService.query<ApiKeyRecord>({
            text: "SELECT * FROM api_keys",
            camelCase: true
        })
        return result.rows
    }

    async getOne(id: string[]) {
        const result = await this.databaseService.query<ApiKeyRecord>({
            text: "SELECT * FROM api_keys WHERE id = $1",
            args: [id],
            camelCase: true,
        })

        return result.rows[0]
    }

    async delete(keysIds: string[]) {
        const result = await this.databaseService.query<ApiKeyRecord>({
            text: "DELETE FROM api_keys WHERE id = ANY($1)",
            args: [keysIds],
        })

        return !!result.rowCount
    }

}
