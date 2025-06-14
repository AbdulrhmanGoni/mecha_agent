export default function contextTemplate(instructions: Instruction[]) {
    let context = "### Context:"

    for (let i = 0; i < instructions.length; i++) {
        context += (`\n\n"${instructions[i].response}"`)
    }

    return context
};
