type ChatMessage = {
    role: string;
    content: string;
}

interface LLMClientInterface {
    chat(messages: ChatMessage[], options?: ChatRequestOptions): Promise<ReadableStream>;
}

interface EmbeddingClientInterface {
    embedText(text: string): Promise<number[]>;
    embeddingDimensions: number
}

type ChatRequestOptions = {
    onResponseComplete?: (responseText: string) => Promise<void> | void;
}

type ChatHistory = {
    id: string;
    messages: ChatMessage[];
    agentId: string;
}

type ChatRelatedTypes = {
    prompt: string;
    agentId: string;
    chatId?: string;
    newMessage: ChatMessage;
    chatMessages: ChatMessage[];
    onResponseComplete: (fullResponseText: string) => Promise<void>;
    userEmail: string;
    isAnonymous?: boolean;
}
