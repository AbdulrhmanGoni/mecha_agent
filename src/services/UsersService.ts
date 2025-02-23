import { hash } from "deno.land/x/bcrypt";
import { DatabaseService } from "./DatabaseService.ts";

export class UsersService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) { }

    async create(userInput: SignUpUserInput) {
        const hashedPassword = await hash(userInput.password);

        const { rows } = await this.databaseService.query<Pick<User, "avatar" | "email"> & { name: string }>({
            text: `
                INSERT INTO users(username, email, password, avatar, signing_method) 
                VALUES($1, $2, $3, $4, $5)
                RETURNING username as name, email, avatar;
            `,
            args: [
                userInput.username,
                userInput.email,
                hashedPassword,
                userInput.avatar,
                userInput.signingMethod,
            ],
            camelCase: true,
        });

        if (rows[0]) {
            return rows[0]
        }

        return null
    }

    async getByEmail(email: string) {
        const { rows } = await this.databaseService.query<User>({
            text: `SELECT * FROM users WHERE email = $1`,
            args: [email],
            camelCase: true,
        });

        if (rows[0]) {
            return rows[0]
        }

        return null
    }
}
