import { Ollama as OllamaClient } from "ollama";
import { GoogleGenAI } from "@google/genai";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { GoogleEmbeddingClient } from "./googleEmbeddingsClient.ts";
import { MockEmbeddingClient } from "../../tests/mock/configs/mockEmbeddingClient.ts";
import { OllamaEmbeddingClient } from "./ollamaEmbeddingsClient.ts";

export function bootstrapEmbeddingClient() {
    let embeddingClient: EmbeddingClientInterface;

    switch (parsedEnvVariables.DENO_ENV) {
        case "production": {
            if (!parsedEnvVariables.GEMINI_API_KEY) {
                throw new Error("'GEMINI_API_KEY' environment variable is missing");
            }

            const googleGenAI = new GoogleGenAI({ apiKey: parsedEnvVariables.GEMINI_API_KEY });
            embeddingClient = new GoogleEmbeddingClient(googleGenAI);
            break;
        }

        case "development": {
            const ollamaClient = new OllamaClient({ host: parsedEnvVariables.OLLAMA_HOST });
            embeddingClient = new OllamaEmbeddingClient(ollamaClient);
            break;
        }

        case "testing": {
            embeddingClient = new MockEmbeddingClient();
            break;
        }

        default:
            throw new Error("'DENO_ENV' environment variable should be neither 'testing', 'development' nor 'production'");
    }

    return embeddingClient
};
