export default function embedInstructionFormat(instruction: Omit<BaseInstruction | UpdateInstructionInput, "id" | "datasetId">) {
    const instructionText = (
        `${instruction.systemMessage ? `"${instruction.systemMessage}"` : ""}` +
        `"${instruction.prompt}" ` +
        `"${instruction.response}"`
    )

    return instructionText;
};
