import parsedEnvVariables from "../src/configurations/parseEnvironmentVariables.ts";

const startDevMode = new Deno.Command("docker", {
    args: ["compose", "-f", "docker/docker-compose-dev.yml", "up", "-d"],
    env: {
        DB_USERNAME: parsedEnvVariables.DB_USERNAME,
        DB_PASSWORD: parsedEnvVariables.DB_PASSWORD,
        DB_NAME: parsedEnvVariables.DB_NAME,
    }
});

const pullEmbeddingModelCommand = new Deno.Command("docker", {
    args: ["exec", "-it", "dev_ollama_container", "ollama", "pull", `${parsedEnvVariables.EMBEDDING_MODEL_NAME}`],
});

const pullLLMCommand = new Deno.Command("docker", {
    args: ["exec", "-it", "dev_ollama_container", "ollama", "pull", `${parsedEnvVariables.BASE_MODEL_NAME}`],
});

const createCustomModelFileCommand = new Deno.Command("docker", {
    args: [
        "exec", "-it", "dev_server_container", "deno", "run",
        "--allow-read", "--allow-net", "--allow-env", "--allow-run",
        "/assistant-server/scripts/createCustomModel.ts"
    ],
});

await startDevMode.spawn().output();

await pullEmbeddingModelCommand.spawn().output();

await pullLLMCommand.spawn().output();

await createCustomModelFileCommand.spawn().output()
