import z from "zod";
import { parseEnvironmentVariables } from "../../src/helpers/parseEnvironmentVariables.ts";
import { setTimeout } from "node:timers/promises";

export const varsSchema = z.object({
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
});

const env = parseEnvironmentVariables(varsSchema);

const startTestingContainers = new Deno.Command("docker", {
    args: ["compose", "-f", "docker/docker-compose-test.yml", "up", "-d"],
    env,
});

await startTestingContainers.spawn().output();

const DATABASE_URL = `postgres://${env.DB_USERNAME}:${env.DB_PASSWORD}@localhost:10002/${env.DB_NAME}?sslmode=disable`

const DatabaseSchemaMigrationCommand = new Deno.Command(
    Deno.execPath(),
    {
        args: ["-E", "--allow-run", "dbmate", "-u", DATABASE_URL, "up"],
        stderr: "null",
    }
)

let tries = 4
while (tries--) {
    const out = await DatabaseSchemaMigrationCommand.spawn().output()
    if (out.success) {
        break
    }

    await setTimeout(500)
}

const restartTestServerCommand = new Deno.Command(
    "docker",
    { args: ["container", "restart", "testing_server_container"], stderr: "null" }
)

restartTestServerCommand.spawn().output()