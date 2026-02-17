import { BlankEnv, HTTPResponseError } from "hono/types";
import { Context } from "hono";
import { routePath } from "hono/route";
import { HTTPException } from "hono/http-exception";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import * as Sentry from "sentry";

export default async (err: Error | HTTPResponseError, c: Context<BlankEnv, never, never>) => {
    if (parsedEnvVariables.ENVIRONMENT !== "production") {
        console.log(err)
    }

    Promise.resolve().then(() => Sentry.captureException(err, {
        user: { email: (c.var as Record<string, string> | undefined)?.userEmail },
        extra: {
            route: `${c.req.method} ${routePath(c)}`,
            fullUrl: c.req.url,
            payload: {
                json: c.req.valid("json"),
                form: c.req.valid("form"),
                query: c.req.valid("query"),
            }
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
