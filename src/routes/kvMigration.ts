import { Context } from "hono";
import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";
import { openKv } from "npm:@deno/kv@0.13.0";

export default async function kvMigration(c: Context) {
    const password = c.req.header("password")
    const passwordEnv = Deno.env.get("KV_MIGRATION_PASSWORD")
    if (!password || !passwordEnv || password !== passwordEnv) {
        const message = "Who are you?!!!!!!!!!!"
        console.log(message)
        return c.body(message, 401);
    }

    const OLD_DENO_KV_URL = Deno.env.get("OLD_DENO_KV_URL")
    if (!OLD_DENO_KV_URL) return c.body("OLD_DENO_KV_URL is not defined", 400)

    const OLD_DENO_KV_TOKEN = Deno.env.get("OLD_DENO_KV_TOKEN")
    if (!OLD_DENO_KV_TOKEN) return c.body("OLD_DENO_KV_TOKEN is not defined", 400)

    const oldKvStoreClient = await openKv(
        OLD_DENO_KV_URL,
        { implementation: "remote", accessToken: OLD_DENO_KV_TOKEN }
    )
    const oldDataIterator = oldKvStoreClient.list({ prefix: [] }, { limit: 100, batchSize: 100 })

    const atomic = kvStoreClient.atomic()
    for await (const entry of oldDataIterator) {
        atomic.set(entry.key, entry.value)
    }
    const result = await atomic.commit()

    if (!result.ok) {
        const message = "Failed to migrate KV store"
        console.log(message)
        return c.body(message, 500);
    }

    const message = "The KV store has been migrated successfully"
    console.log(message)
    return c.body(message, 200);
}