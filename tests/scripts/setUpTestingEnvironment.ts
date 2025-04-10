import parsedEnvVariables from "../../src/configurations/parseEnvironmentVariables.ts";

const startTestingMode = new Deno.Command("docker", {
    args: ["compose", "-f", "docker/docker-compose-test.yml", "up", "-d"],
    env: {
        DB_USERNAME: parsedEnvVariables.DB_USERNAME,
        DB_PASSWORD: parsedEnvVariables.DB_PASSWORD,
        DB_NAME: parsedEnvVariables.DB_NAME,
    }
});

await startTestingMode.spawn().output();
