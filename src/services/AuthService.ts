import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import { JwtService } from "./JwtService.ts";

export class AuthService {
    constructor(private readonly jwtService: JwtService) { }

    async logInAsRoot(username: string, password: string) {
        if (
            username === parsedEnvVariables.ROOT_USERNAME &&
            password === parsedEnvVariables.ROOT_PASSWORD
        ) {
            return await this.jwtService.generateJwt({
                maxAgeInDays: 30,
                permissions: ["inference", "read", "write"],
                user: "root"
            })
        }
        return false
    }

    getRootData() {
        return {
            name: "root",
            avatar: null,
        }
    }
}