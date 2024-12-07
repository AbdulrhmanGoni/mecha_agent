type Instruction = {
    id: string;
    datasetId: string;
    systemMessage?: string;
    prompt: string;
    response: string;
}

type InstructionInput = Instruction;

type UpdateInstructionInput = WithOptionalFields<Instruction, "response" | "prompt">;

