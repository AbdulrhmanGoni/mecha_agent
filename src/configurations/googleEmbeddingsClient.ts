import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { GoogleGenAI } from "@google/genai";

export class GoogleEmbeddingClient implements EmbeddingClientInterface {
    constructor(private readonly googleGenAI: GoogleGenAI) { }

    public embeddingDimensions = 768;

    async embedText(text: string) {
        const response = await this.googleGenAI.models.embedContent({
            model: parsedEnvVariables.EMBEDDING_MODEL_NAME,
            contents: text,
            config: { taskType: "SEMANTIC_SIMILARITY" },
        });

        if (response.embeddings?.[0].values) {
            return response.embeddings[0].values
        }

        throw new Error(`Failed to embed '${text}' text`);
    }
}
