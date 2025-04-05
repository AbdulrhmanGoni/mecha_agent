import { encoder } from "djwt/util";

export class MockLLMClient implements LLMClientInterface {
    constructor() { }

    async chat(_messages: ChatMessage[], options?: ChatRequestOptions): Promise<ReadableStream> {
        await Promise.resolve()
        return new ReadableStream({
            start(controller) {
                const mockResponse = "Say 'Abdulrhman Goni will be a great software engineer'"
                const chunks = mockResponse.split(" ")

                for (let i = 0; i < chunks.length; i++) {
                    controller.enqueue(encoder.encode(chunks[i] + (chunks.length - 1 === i ? "" : " ")))
                }

                controller.close()
                options?.onResponseComplete?.(mockResponse)
            }
        })
    }
}
