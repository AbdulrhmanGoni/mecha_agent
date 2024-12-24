import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { EmbeddingService } from "./EmbeddingService.ts";

export class VectorDatabaseService {
    private readonly datasetsCollection = "datasets";

    constructor(
        private readonly dbClient: QdrantClient,
        private readonly embeddingService: EmbeddingService,
    ) { }

    async init() {
        await this.createDatasetsCollection()
    }

    private async createDatasetsCollection() {
        const collectionExists = await this.dbClient.collectionExists(this.datasetsCollection);
        if (!collectionExists) {
            await this.dbClient.createCollection(this.datasetsCollection, {
                vectors: {
                    size: 384,
                    distance: "Cosine",
                    on_disk: true,
                },
                on_disk_payload: true,
                hnsw_config: {
                    m: 0,
                    payload_m: 16,
                    on_disk: true,
                }
            });

            await this.dbClient.createPayloadIndex(this.datasetsCollection, {
                field_name: "datasetId",
                field_schema: {
                    type: "keyword",
                    is_tenant: true,
                },
            })
        }
    }
}
