import { bearerAuth } from "hono/bearer-auth";
import { JwtService } from "./JwtService.ts";
import { DatabaseService } from "./DatabaseService.ts";
import apiKeysResponseMessages from "../constant/response-messages/apiKeysResponsesMessages.ts";

type GuardRouteOptions = {
    permissions?: Permission[],
}

export class GuardService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly databaseService: DatabaseService,
    ) { }

    guardRoute({ permissions }: GuardRouteOptions) {
        return bearerAuth({
            verifyToken: async (token, c) => {
                const { payload, errorMessage } = await this.jwtService.verifyJwt(token);

                if (payload) {
                    if (payload.apiKeyId) {
                        const isActiveKey = await this.checkApiKeyStatus(payload.apiKeyId)
                        if (!isActiveKey) {
                            c.set(
                                "auth-error-message",
                                isActiveKey === false ? apiKeysResponseMessages.inactiveApiKey : apiKeysResponseMessages.unknownApiKey
                            );
                            return false
                        }
                        c.set("apiKeyId", payload.apiKeyId);
                    }

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

    async checkApiKeyStatus(apiKeyId: string) {
        const { rows: [apiKey] } = await this.databaseService.query<Pick<ApiKeyRecord, "status"> | null>({
            text: "SELECT status FROM api_keys WHERE id = $1",
            args: [apiKeyId],
        });

        return apiKey ? apiKey.status === "Active" : null;
    }
}