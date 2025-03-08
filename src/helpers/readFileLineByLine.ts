import type { Readable } from "node:stream";

type ReadFileLineByLineOptions = {
    onLine: (line: string, lineNumber?: number) => void;
    onEnd?: () => void;
}

export async function readFileLineByLine(readableFile: Readable | ReadableStream, { onLine, onEnd }: ReadFileLineByLineOptions) {
    const decoder = new TextDecoder();
    let buffer = "";
    let lineNumber = 1;

    for await (const chunk of readableFile) {
        buffer += decoder.decode(chunk, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            onLine(line, lineNumber)
            lineNumber++
        }
    }

    if (buffer) {
        onLine(buffer, lineNumber)
    }

    onEnd?.()
}