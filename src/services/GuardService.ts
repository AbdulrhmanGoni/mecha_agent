import { bearerAuth } from "hono/bearer-auth";
import { JwtService } from "./JwtService.ts";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

type GuardRouteOptions = {
    permissions?: Permission[],
    rootUser?: boolean
}

export class GuardService {
    constructor(private readonly jwtService: JwtService) { }

    guardRoute({ permissions, rootUser }: GuardRouteOptions) {
        return bearerAuth({
            verifyToken: async (token, c) => {
                const result = await this.jwtService.verifyJwt(token);

                if (rootUser && result.payload?.user === parsedEnvVariables.ROOT_USERNAME) {
                    c.set("user", parsedEnvVariables.ROOT_USERNAME)
                    return true
                }

                if (result.errorMessage) {
                    c.set("auth-error-message", result.errorMessage);
                    return false;
                }

                const hasPermission = !!(permissions?.every((permission) => (
                    result.payload?.permissions?.includes(permission)
                )))

                if (hasPermission) {
                    c.set("user", result.payload?.user)
                }

                return hasPermission
            },
            noAuthenticationHeaderMessage: { error: "Authentication header is missing" },
            invalidAuthenticationHeaderMessage: { error: "Invalid authentication header" },
            invalidTokenMessage: (c) => (
                { error: c.get("auth-error-message") || "You are unauthorized" }
            ),
        })
    }
}