import z from "zod";
import { parseEnvironmentVariables } from "../src/helpers/parseEnvironmentVariables.ts";

export const envSchema = z.object({
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_PORT: z.coerce.number(),
});

const env = parseEnvironmentVariables(envSchema);

const DATABASE_URL = `postgres://${env.DB_USERNAME}:${env.DB_PASSWORD}@localhost:${env.DB_PORT}/${env.DB_NAME}?sslmode=disable`;

const migrationCommand = new Deno.Command(
    Deno.execPath(),
    { args: ["-E", "--allow-run", "dbmate", "-u", DATABASE_URL, ...Deno.args] }
)

migrationCommand.spawn().output()