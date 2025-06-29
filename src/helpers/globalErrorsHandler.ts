import { HTTPResponseError } from "hono/types";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import * as Sentry from "sentry";

export default async (err: Error | HTTPResponseError, c: Context<never, never, never>) => {
    if (parsedEnvVariables.ENVIRONMENT !== "production") {
        console.log(err)
    }

    Promise.resolve().then(() => Sentry.captureException(err, {
        user: { email: c.get("userEmail") },
        extra: {
            route: c.req.routePath,
            fullUrl: c.req.url,
            origin: "server",
            payload: c.req.valid("json") || c.req.valid("form") || c.req.valid("query")
        }
    }))

    if (err instanceof HTTPException) {
        if (err.message) {
            return c.json({ error: err.message }, err.status);
        } else {
            return c.json(await err.getResponse().json(), err.status);
        }
    } else {
        return c.json({ error: "Unexpected Server Error !" }, 500)
    }
}
