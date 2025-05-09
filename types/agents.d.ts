type Agent = {
    id: string;
    agentName: string;
    description: string;
    avatar?: string;
    userEmail: string;
    datasetId?: string | null;
    systemInstructions?: string;
    dontKnowResponse?: string;
    responseSyntax?: import("../src/constant/agents.ts").ResponseSyntax;
    greetingMessage?: string;
    isPublished: boolean;
    createdAt: Date;
}

type CreateAgentFormData = Omit<Agent, "id" | "userEmail" | "avatar" | "createdAt" | "datasetId"> & {
    avatar?: File
}

type UpdateAgentFormData = Partial<CreateAgentFormData> & {
    removeAvatar?: boolean
}