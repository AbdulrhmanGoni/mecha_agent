import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import { inferencePermission, readPermission, writePermission } from "../constant/permissions.ts";
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
                permissions: [inferencePermission, readPermission, writePermission],
                user: parsedEnvVariables.ROOT_USERNAME
            })
        }
        return false
    }

    getRootUserData() {
        return {
            name: parsedEnvVariables.ROOT_USERNAME,
            avatar: null,
        }
    }
}