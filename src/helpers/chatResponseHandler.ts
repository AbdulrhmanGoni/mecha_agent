import { encoder } from "djwt/util";

type ChatResponseHandlerParams = {
    llmResponse: any;
    onResponseComplete: (responseText: string) => Promise<void>;
}

export default function chatResponseHandler({ onResponseComplete, llmResponse }: ChatResponseHandlerParams): ReadableStream {
    const { readable, writable } = new TransformStream();

    (async () => {
        const writer = writable.getWriter();
        let responseText = "";

        for await (const llmResponsePart of llmResponse) {
            writer.write(encoder.encode(llmResponsePart.message.content));
            responseText += llmResponsePart.message.content
        }

        writer.close();

        return responseText
    })().then(async (responseText) => {
        await onResponseComplete(responseText)
    })

    return readable;
};
