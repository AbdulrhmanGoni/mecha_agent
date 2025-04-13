import { it } from "@std/testing/bdd";
import chatResponseHandler from "../../src/helpers/chatResponseHandler.ts";
import { expect } from "@std/expect";
import { decoder, encoder } from "djwt/util";

export default function chatResponseHandler_test() {
    it("Should read the readable stream and then fire `onResponseComplete` callback with the full text response", async () => {
        expect.assertions(2);

        const mockResponseAsStream = 'This is a mock response to test chatResponseHandler helper function';

        const mockStream = new ReadableStream({
            start(controller) {
                const chunks = mockResponseAsStream.split(" ");
                for (let i = 0; i < chunks.length; i++) {
                    controller.enqueue(encoder.encode(chunks[i] + (i === chunks.length - 1 ? "" : " ")))
                }
                controller.close()
            },
        })

        const resultStream = chatResponseHandler<Uint8Array>({
            onResponseComplete(responseText) {
                expect(responseText).toBe(mockResponseAsStream)
            },
            extractChunkData(chunk) {
                return decoder.decode(chunk)
            },
            llmResponse: mockStream
        })

        let responseText = ""
        for await (const chunk of resultStream) {
            responseText += decoder.decode(chunk)
        }

        expect(responseText).toBe(mockResponseAsStream);
    });
};
