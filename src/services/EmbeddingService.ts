import { Ollama } from "ollama";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";

export class EmbeddingService {
    constructor(private readonly ollamaClient: Ollama) { }

    async embedText(text: string) {
        return await this.ollamaClient.embeddings({
            keep_alive: "1h",
            model: parsedEnvVariables.EMBEDDING_MODEL_NAME,
            prompt: text,
            options: {
                embedding_only: true,
            }
        });
    }
}
