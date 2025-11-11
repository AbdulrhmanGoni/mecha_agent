import { Client as PostgresClient } from "deno.land/x/postgres";
import randomString from "../../src/helpers/randomString.ts";

export default async function insertApiKeysIntoDB(
    { db, keys }: { db: PostgresClient, keys: (CreateApiKeyInput & { status?: ApiKeyStatus })[] }
) {
    const fields = `key, key_name, expiration_date, permissions, user_email, status`;
    const fieldsCount = fields.split(",")

    const placeholders = keys.map((_, i) => (
        `(${fieldsCount.map((_, j) => `$${i * fieldsCount.length + (j + 1)}`).join(",")})`
    )).join(", ")

    const valuse = keys.flatMap((key) => [
        randomString(key.keyName.length + 10),
        key.keyName,
        null,
        key.permissions,
        key.userEmail,
        key.status || "Active",
    ])

    const { rows } = await db.queryObject<Pick<ApiKeyRecord, "id" | "keyName">>({
        text: `INSERT INTO api_keys(${fields}) VALUES ${placeholders} RETURNING id, key_name`,
        args: valuse
    })

    return rows
};
