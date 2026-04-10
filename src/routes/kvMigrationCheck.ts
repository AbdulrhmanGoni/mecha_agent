import { Context } from "hono";
import { kvStoreClient } from "../configurations/denoKvStoreClient.ts";
import { openKv } from "npm:@deno/kv@0.13.0";

export default async function kvMigrationCheck(c: Context) {
    const password = c.req.header("password")
    const passwordEnv = Deno.env.get("KV_MIGRATION_PASSWORD")
    if (!password || !passwordEnv || password !== passwordEnv) {
        const message = "Who are you?!!!!!!!!!!"
        console.log(message)
        return c.text(message, 401);
    }

    const OLD_DENO_KV_URL = Deno.env.get("OLD_DENO_KV_URL")
    if (!OLD_DENO_KV_URL) return c.text("OLD_DENO_KV_URL is not defined", 400)

    const OLD_DENO_KV_TOKEN = Deno.env.get("OLD_DENO_KV_TOKEN")
    if (!OLD_DENO_KV_TOKEN) return c.text("OLD_DENO_KV_TOKEN is not defined", 400)

    const oldKvStoreClient = await openKv(
        OLD_DENO_KV_URL,
        { implementation: "remote", accessToken: OLD_DENO_KV_TOKEN }
    )
    const oldDataIterator = oldKvStoreClient.list({ prefix: [] }, { limit: 100, batchSize: 100 })

    let migratedKeysCount = 0
    let totalKeysCount = 0
    for await (const entry of oldDataIterator) {
        const result = await kvStoreClient.get(entry.key)
        totalKeysCount++
        if (result.value !== null && result.versionstamp !== entry.versionstamp) {
            migratedKeysCount++
        }
    }

    const message = `Migrated ${migratedKeysCount} out of ${totalKeysCount} keys`
    console.log(message)
    return c.text(message, 200);
}