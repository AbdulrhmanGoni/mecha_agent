export default function contextTemplate(instructions: Instruction[]) {
    return instructions.reduce((text, currentInstruction) => {
        text += (
            `"${currentInstruction.systemMessage ? currentInstruction.systemMessage + "; " : ""}` +
            `${currentInstruction.response}", `
        )
        return text
    }, "### Context: ")
};
