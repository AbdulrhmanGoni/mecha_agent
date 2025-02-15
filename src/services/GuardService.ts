import { bearerAuth } from "hono/bearer-auth";
import { JwtService } from "./JwtService.ts";

type GuardRouteOptions = {
    permissions?: Permission[],
}

export class GuardService {
    constructor(private readonly jwtService: JwtService) { }

    guardRoute({ permissions }: GuardRouteOptions) {
        return bearerAuth({
            verifyToken: async (token, c) => {
                const { payload, errorMessage } = await this.jwtService.verifyJwt(token);

                if (payload) {
                    const hasPermission = !!(permissions?.every((permission) => (
                        payload.permissions?.includes(permission)
                    )))

                    if (hasPermission && payload.email) {
                        c.set("userEmail", payload.email)
                        return hasPermission
                    }
                }

                if (errorMessage) {
                    c.set("auth-error-message", errorMessage);
                }

                return false;
            },
            noAuthenticationHeaderMessage: { error: "Authentication header is missing" },
            invalidAuthenticationHeaderMessage: { error: "Invalid authentication header" },
            invalidTokenMessage: (c) => (
                { error: c.get("auth-error-message") || "You are unauthorized" }
            ),
        })
    }
}