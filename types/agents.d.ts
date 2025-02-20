type Agent = {
    id: string;
    agentName: string;
    description: string;
    avatar?: string;
    userEmail: string;
    datasetId?: string | null;
    systemInstructions?: string;
    dontKnowResponse?: string;
    responseSyntax?: import("../src/constant/responseSyntaxes.ts").ResponseSyntax;
    greetingMessage?: string;
    createdAt: Date;
}

type CreateAgentFormData = Omit<Agent, "id" | "userEmail" | "avatar" | "createdAt" | "datasetId"> & {
    avatar?: File
}

type UpdateAgentFormData = Partial<CreateAgentFormData> & {
    removeAvatar?: boolean
}