export default function embedInstructionFormat(instruction: Pick<Instruction, "prompt" | "response">) {
    const instructionText = (
        `"${instruction.prompt}" ` +
        `"${instruction.response}"`
    )

    return instructionText;
};
