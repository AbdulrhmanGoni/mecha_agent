import { Ollama as OllamaClient } from "ollama";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import { OllamaLLMClient } from "./ollamaLLMClient.ts";
import { GoogleGenAI } from "@google/genai";
import { MockLLMClient } from "../../tests/mock/configs/mockLLMClient.ts";
import { GoogleLLMClient } from "./googleLLMClient.ts";

export function bootstrapLLMClient() {
    let llmClient: LLMClientInterface;

    switch (parsedEnvVariables.DENO_ENV) {
        case "production": {
            if (!parsedEnvVariables.GEMINI_API_KEY) {
                throw new Error("'GEMINI_API_KEY' environment variable is missing");
            }

            const googleGenAI = new GoogleGenAI({ apiKey: parsedEnvVariables.GEMINI_API_KEY });
            llmClient = new GoogleLLMClient(googleGenAI);
            break;
        }

        case "development": {
            const ollamaClient = new OllamaClient({ host: parsedEnvVariables.OLLAMA_HOST });
            llmClient = new OllamaLLMClient(ollamaClient);
            break;
        }

        case "testing": {
            llmClient = new MockLLMClient();
            break;
        }

        default:
            throw new Error("'DENO_ENV' environment variable is neither 'testing', 'development' nor 'production'");
    }

    return llmClient
};
