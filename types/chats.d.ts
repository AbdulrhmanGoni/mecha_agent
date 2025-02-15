type ChatMessage = Pick<import("ollama").Message, "content" | "role">;

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
    userEmail: string
}
