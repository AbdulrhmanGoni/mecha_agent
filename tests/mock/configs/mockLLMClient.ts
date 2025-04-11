import { encoder } from "djwt/util";

export const mockLLMResponse = "Abdulrhman Goni will be a great software engineer"

export class MockLLMClient implements LLMClientInterface {
    constructor() { }

    async chat(_messages: ChatMessage[], options?: ChatRequestOptions): Promise<ReadableStream> {
        await Promise.resolve()
        return new ReadableStream({
            start(controller) {
                const chunks = mockLLMResponse.split(" ")

                for (let i = 0; i < chunks.length; i++) {
                    controller.enqueue(encoder.encode(chunks[i] + (chunks.length - 1 === i ? "" : " ")))
                }

                controller.close()
                options?.onResponseComplete?.(mockLLMResponse)
            }
        })
    }
}
