export class EmbeddingService {
    constructor(private readonly embeddingClient: EmbeddingClientInterface) { }

    public get embeddingDimensions() {
        return this.embeddingClient.embeddingDimensions
    }

    async embedText(text: string) {
        return await this.embeddingClient.embedText(text);
    }
}
