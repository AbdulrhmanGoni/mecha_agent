type ChatMessage = Pick<import("npm:ollama").Message, "content" | "role">;

type ChatHistory = {
    id: string;
    messages: ChatMessage[];
    agentId: string;
}

type ChatRelatedTypes = {
    prompt: string;
    agentId: string;
    chatId: string;
    chatMessages: ChatMessage[];
    onResponseComplete: (fullResponseText: string) => Promise<void>;
    user: string
}
