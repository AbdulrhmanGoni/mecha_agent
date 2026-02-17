type CreateAgentFormData = {
    agentName: string;
    description: string;
    avatar?: string;
    systemInstructions?: string;
    dontKnowResponse?: string;
    greetingMessage?: string;
}
type Agent = {
    id: string;
    userEmail: string;
    datasetId?: string | null;
    isPublished: boolean;
    createdAt: Date;
} & CreateAgentFormData

type UpdateAgentFormData = Partial<CreateAgentFormData> & {
    removeAvatar?: boolean
}