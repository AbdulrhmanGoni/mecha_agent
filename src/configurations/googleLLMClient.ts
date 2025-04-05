import parsedEnvVariables from "./parseEnvironmentVariables.ts";
import chatResponseHandler from "../helpers/chatResponseHandler.ts";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

export class GoogleLLMClient implements LLMClientInterface {
    constructor(private readonly googleGenAI: GoogleGenAI) { }

    async chat(messages: ChatMessage[], options?: ChatRequestOptions): Promise<ReadableStream> {
        const response = await this.googleGenAI.models.generateContentStream({
            model: parsedEnvVariables.MODEL_NAME,
            contents: messages.map((message) => ({
                role: message.role,
                text: message.content,
            }))
        });

        return chatResponseHandler<GenerateContentResponse>({
            llmResponse: response as unknown as ReadableStream,
            extractChunkData: (chunk) => chunk.text || "",
            onResponseComplete: options?.onResponseComplete
        })
    }
}
