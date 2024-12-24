import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { Schemas } from "npm:@qdrant/js-client-rest";
import objectIdToUUID from "../helpers/objectIdToUUID.ts";
import { EmbeddingService } from "./EmbeddingService.ts";
import embedInstructionFormat from "../helpers/embedInstructionFormat.ts";

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

    async insertInstructions(instruction: InstructionInput[]) {
        const points = new Array<Schemas["PointStruct"]>(instruction.length)

        for (let i = 0; i < instruction.length; i++) {
            const instructionEmbedding = await this.embeddingService.embedText(
                embedInstructionFormat(instruction[i])
            )

            points[i] = {
                id: objectIdToUUID(instruction[i].id),
                vector: instructionEmbedding.embedding,
                payload: instruction[i]
            }
        }

        return await this.dbClient.upsert(this.datasetsCollection, { points })
    }
}
