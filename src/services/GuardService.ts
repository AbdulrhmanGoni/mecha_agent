import { bearerAuth } from "hono/bearer-auth";
import { JwtService } from "./JwtService.ts";
import { type Client as PostgresClient } from "deno.land/x/postgres";
import apiKeysResponseMessages from "../constant/response-messages/apiKeysResponsesMessages.ts";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import { Context } from "hono";
import { MiddlewareHandler, Next } from "hono/types";
import { ApiKeysService } from "./ApiKeysService.ts";

type GuardRouteOptions = {
    permissions?: Permission[];
    sudoOnly?: boolean;
}

export class GuardService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly dbClient: PostgresClient,
        private readonly kv: Deno.Kv,
        private readonly apiKeysService: ApiKeysService,
    ) {
        if (parsedEnvVariables.ENVIRONMENT === "production") {
            if (!parsedEnvVariables.METRICS_SCRAPPER_TOKEN) {
                throw new Error("METRICS_SCRAPPER_TOKEN is not set in production environment");
            }
        }
    }

    guardRoute({ permissions, sudoOnly }: GuardRouteOptions): MiddlewareHandler {
        return async (c, next) => {
            const apiKey = c.req.header("Api-Key")
            if (apiKey && !sudoOnly) {
                const response = await this.apiKeysGuard(c, apiKey, { permissions })
                if (response instanceof Response) {
                    return response
                }
                await next()
            } else {
                return this.jwtGuard(c, next)
            }
        }
    }

    async apiKeysGuard(c: Context, apiKey: string, { permissions }: GuardRouteOptions) {
        if (!permissions || permissions.length < 1) {
            return c.json({ error: apiKeysResponseMessages.insufficientPermissions }, 401);
        }

        const apiKeyRecord = await this.apiKeysService.verifyApiKey(apiKey, permissions)
        switch (apiKeyRecord) {
            case this.apiKeysService.InvalidApiKey:
                return c.json({ error: apiKeysResponseMessages.unauthenticateApiKey }, 401);
            case this.apiKeysService.InactiveApiKey:
                return c.json({ error: apiKeysResponseMessages.inactiveApiKey }, 401);
            case this.apiKeysService.InvalidApiKeySecret:
                return c.json({ error: apiKeysResponseMessages.invalidApiKey }, 401);
            case this.apiKeysService.ExpiredApiKey:
                return c.json({ error: apiKeysResponseMessages.expiredApiKey }, 401);
            case this.apiKeysService.InsufficientPermissions:
                return c.json({ error: apiKeysResponseMessages.insufficientPermissions }, 401);
        }

        c.set("userEmail", apiKeyRecord.userEmail);
        c.set("apiKeyId", apiKeyRecord.id);
    }

    jwtGuard(c: Context, next: Next) {
        return bearerAuth({
            verifyToken: async (token, c) => {
                const { payload, errorMessage } = await this.jwtService.verifyJwt(token);
                if (payload) {
                    c.set("userEmail", payload.email)
                    return true
                }

                if (errorMessage) {
                    c.set("auth-error-message", errorMessage);
                }

                return false;
            },
            noAuthenticationHeaderMessage: { error: "Authentication header is missing" },
            invalidAuthenticationHeaderMessage: { error: "Invalid authentication header" },
            invalidToken: {
                message: (c) => (
                    { error: `Invalid Token: ${c.get("auth-error-message") || "You are not authenticated"}` }
                ),
            },
        })(c, next)
    }

    guardMetricsRoute() {
        if (parsedEnvVariables.ENVIRONMENT === "production") {
            return bearerAuth({
                verifyToken: (token) => {
                    return token === parsedEnvVariables.METRICS_SCRAPPER_TOKEN
                },
                noAuthenticationHeaderMessage: { error: "Authentication header is missing" },
                invalidAuthenticationHeaderMessage: { error: "Invalid authentication header" },
                invalidTokenMessage: (c) => (
                    { error: c.get("auth-error-message") || "You are unauthorized" }
                ),
            })
        }

        return (_c: Context, next: Next) => next()
    }

    async publicAgentCheck(c: Context, next: Next) {
        const agentId = c.req.query("agentId") as string;
        const record = await this.kv.get<string>(["published_agent_owner", agentId])
        if (!record.value) {
            return c.json({ error: "Agent not found" }, 404)
        }

        c.set("userEmail", record.value)
        await next()
    }
}