type Agent = {
    id: string;
    agentName: string;
    description: string;
    avatar?: string;
    datasetId?: string;
    systemInstructions?: string;
    dontKnowResponse?: string;
    responseSyntax: import("../src/constant/responseSyntaxes.ts").ResponseSyntax;
    createdAt: Date;
}

type CreateAgentFormData = Omit<Agent, "id" | "avatar" | "createdAt"> & {
    avatar?: File
}

type UpdateAgentFormData = Partial<CreateAgentFormData> & {
    removeAvatar?: boolean
}