export default function embedInstructionFormat(instruction: Omit<Instruction | UpdateInstructionInput, "id" | "datasetId">) {
    const instructionText = (
        `${instruction.systemMessage ? `"${instruction.systemMessage}"` : ""}` +
        `"${instruction.prompt}" ` +
        `"${instruction.response}"`
    )

    return instructionText;
};
