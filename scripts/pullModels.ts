import parsedEnvVariables from "../src/configurations/parseEnvironmentVariables.ts";


const pullEmbeddingModelCommand = new Deno.Command("docker", {
    args: ["exec", "-it", "dev_ollama_container", "ollama", "pull", `${parsedEnvVariables.EMBEDDING_MODEL_NAME}`],
});

const pullLLMCommand = new Deno.Command("docker", {
    args: ["exec", "-it", "dev_ollama_container", "ollama", "pull", `${parsedEnvVariables.MODEL_NAME}`],
});

await pullEmbeddingModelCommand.spawn().output();

await pullLLMCommand.spawn().output();
