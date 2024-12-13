export default function promptTemplete(instructions: Instruction[], prompt: string) {
    const instructionsText = instructions.reduce((text, currentInstruction) => {
        text += (
            `"${currentInstruction.systemMessage ? currentInstruction.systemMessage + "; " : ""}` +
            `${currentInstruction.response}", `
        )
        return text
    }, "### Context: ")

    return (
        instructionsText + "\n" +
        `### Prompt: ${prompt}`
    )
};
