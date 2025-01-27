export function jsonLineParser(line: string): Pick<Instruction, "prompt" | "response" | "systemMessage"> | null {
    const { systemMessage, prompt, response } = JSON.parse(line)

    if (!prompt || !response) return null

    return {
        systemMessage,
        prompt,
        response
    }
}