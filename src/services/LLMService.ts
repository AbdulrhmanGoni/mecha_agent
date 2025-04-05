export class LLMService {
    constructor(private readonly llmClient: LLMClientInterface) { }

    async chat(messages: ChatMessage[], options?: ChatRequestOptions) {
        return await this.llmClient.chat(messages, options)
    }
}
