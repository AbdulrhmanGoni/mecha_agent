type Dataset = {
    id: string;
    agentId: string;
    title: string;
    description: string;
    status: "processing" | "processed" | "unprocessed";
    createdAt: string;
}

type CreateDatasetInput = Pick<Dataset, "title" | "description" | "agentId"> & {
    datasetFile: File;
}

type BaseInstruction = {
    systemMessage?: string;
    prompt: string;
    response: string;
}

type Instruction = BaseInstruction & {
    id: string;
    datasetId: string;
}

type InstructionInput = Instruction;

type UpdateInstructionInput = WithOptionalFields<Instruction, "response" | "prompt">;

