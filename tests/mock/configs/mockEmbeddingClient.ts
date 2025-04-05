import testingEmbedding from "../data/testingEmbedding.json" with { type: "json" };

export class MockEmbeddingClient implements EmbeddingClientInterface {
    constructor() { }

    embeddingDimensions = 384;

    async embedText(_text: string): Promise<number[]> {
        await Promise.resolve()
        return testingEmbedding as number[]
    }
}
