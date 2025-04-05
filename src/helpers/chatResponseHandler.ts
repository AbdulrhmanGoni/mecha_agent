import { encoder } from "djwt/util";

type ChatResponseStreamHandlerParams<T> = {
    llmResponse: ReadableStream<T>;
    extractChunkData: (chunk: T) => string;
    onResponseComplete?: ChatRequestOptions["onResponseComplete"];
}

export default function chatResponseHandler<T>({ extractChunkData, onResponseComplete, llmResponse }: ChatResponseStreamHandlerParams<T>): ReadableStream {
    const { readable, writable } = new TransformStream();

    (async () => {
        const writer = writable.getWriter();
        let responseText = "";

        for await (const llmResponsePart of llmResponse) {
            const chunk = extractChunkData(llmResponsePart)
            writer.write(encoder.encode(chunk));
            responseText += chunk
        }

        writer.close();

        return responseText
    })().then(async (responseText) => {
        await onResponseComplete?.(responseText)
    })

    return readable;
};
