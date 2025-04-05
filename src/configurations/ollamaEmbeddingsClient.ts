import { Ollama } from "ollama";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";

export class OllamaEmbeddingClient implements EmbeddingClientInterface {
    constructor(private readonly ollamaClient: Ollama) { }

    public embeddingDimensions = 384;

    async embedText(text: string) {
        const response = await this.ollamaClient.embeddings({
            keep_alive: "1h",
            model: parsedEnvVariables.EMBEDDING_MODEL_NAME,
            prompt: text,
            options: {
                embedding_only: true,
            }
        });

        return response.embedding
    }
}
