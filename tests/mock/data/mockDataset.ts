import mockInstructions from "./mockInstructions.ts";

export function mockDatasetForAgents(agent: Pick<Agent, "agentName" | "id">) {
    return {
        title: `${agent.agentName}'s dataset"`,
        description: `The dataset that '${agent.agentName}' agent answers questions based on`,
        agentId: agent.id,
    }
};

export function getMockDatasetFile() {
    const instructionsFileText = mockInstructions
        .map(({ prompt, response, systemMessage }) => JSON.stringify({ prompt, response, systemMessage }))
        .join("\n")

    return new Blob([instructionsFileText], { type: "application/jsonl" })
}
