import { ChatResponse, Ollama } from "ollama";
import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import chatResponseHandler from "../helpers/chatResponseHandler.ts";

export class OllamaLLMClient implements LLMClientInterface {
    constructor(private readonly ollamaClient: Ollama) { }

    async chat(messages: ChatMessage[], options?: ChatRequestOptions): Promise<ReadableStream> {
        const llmResponse = await this.ollamaClient.chat({
            model: parsedEnvVariables.MODEL_NAME,
            messages,
            keep_alive: "1h",
            stream: true,
        })

        return chatResponseHandler<ChatResponse>({
            llmResponse: llmResponse as unknown as ReadableStream,
            onResponseComplete: options?.onResponseComplete,
            extractChunkData: (chunk) => chunk.message.content
        })
    }
}
