
const mockAgents: Agent[] = [
    {
        id: "f277f2da-8d02-4ec8-a8d9-31aa9d8e6694",
        agentName: "TDM Agent",
        description: "The AI agent assistant of Abdulrhman Goni in 'LLMs TDM' Project",
        systemInstructions: "",
        createdAt: new Date("2025-01-24 16:42:12.243918"),
        dontKnowResponse: "",
        responseSyntax: "markdown",
        avatar: "f56113aa-5172-4199-82ff-4f64d2941952.webp",
        greetingMessage: "Hello, How can i help you?",
        isPublished: true,
        datasetId: "5068e70e-1c1a-4f67-9b8e-164cbe33faa5",
        userEmail: "exampleuser@gamin"
    },
    {
        id: "05b31738-ef1a-40ff-8944-f178454d47ee",
        agentName: "Mecha Goni",
        description: "The AI Assistant of The software developer Abdulrhman Goni",
        systemInstructions: "",
        createdAt: new Date("2024-12-23 15:27:22.223696"),
        dontKnowResponse: "",
        responseSyntax: "markdown",
        avatar: "892f0aff-0135-48fd-8f16-8fee90293663.png",
        greetingMessage: "Hello, How can i help you?",
        isPublished: true,
        datasetId: "c3606e51-aba3-43dc-9d91-51a880f32706",
        userEmail: "exampleuser@gmail.com"
    },
    {
        id: "8511ab6b-6c4f-435a-8e70-4d0d52ecd460",
        agentName: "Mecha Dhme",
        description: "The robot brother of Abdulrhman Goni",
        systemInstructions: "",
        createdAt: new Date("2025-01-16 22:04:59.430696"),
        dontKnowResponse: "",
        responseSyntax: "markdown",
        avatar: "740f99ee-cf3a-4acb-abe9-ef061dd35f94.webp",
        greetingMessage: "Hi, What can i help with?",
        isPublished: true,
        datasetId: null,
        userEmail: "exampleuser@gamin"
    }
]

export function getRandomMockAgent() {
    return mockAgents[Math.floor(mockAgents.length * Math.random())]
}

export function getRandomMockNewAgentInput(): CreateAgentFormData {
    const {
        agentName,
        description,
        systemInstructions,
        dontKnowResponse,
        responseSyntax,
        isPublished,
        greetingMessage,
    } = getRandomMockAgent()

    return {
        agentName,
        description,
        systemInstructions,
        dontKnowResponse,
        responseSyntax,
        isPublished,
        greetingMessage,
    }
}

export default mockAgents;
