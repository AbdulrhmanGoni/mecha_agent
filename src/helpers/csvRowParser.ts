export function csvRowParser(line: string, lineNumber?: number): BaseInstruction | null {
    if (lineNumber === 1) {
        return null
    } else {
        let [systemMessage, prompt, response] = line.split('","')

        systemMessage = systemMessage.slice(1)
        response = response.slice(0, response.length - 1)

        return {
            systemMessage: systemMessage,
            prompt,
            response
        }
    }
}