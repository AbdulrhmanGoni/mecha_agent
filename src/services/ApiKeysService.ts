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

}
