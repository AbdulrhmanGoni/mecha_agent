import { HTTPResponseError } from "hono/types";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export default async (err: Error | HTTPResponseError, c: Context) => {
    if (parsedEnvVariables.DENO_ENV !== "production") {
        console.log(err)
    }

    if (err instanceof HTTPException) {
        if (err.message) {
            return c.json({ error: err.message }, err.status);
        } else {
            return c.json(await err.getResponse().json(), err.status);
        }
    } else {
        return c.json({ error: "Unexpected Error !" }, 500)
    }
}
