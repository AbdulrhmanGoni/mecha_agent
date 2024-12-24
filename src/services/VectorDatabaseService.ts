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

    async updateInstructions(instruction: UpdateInstructionInput[]) {
        const updateData = instruction.reduce<{ ids: Array<string>, updateDataMap: Record<string, UpdateInstructionInput> }>((updateData, instruction, i) => {
            const id = objectIdToUUID(instruction.id)
            updateData.updateDataMap[id] = instruction;
            updateData.ids[i] = id;
            return updateData;
        }, { ids: new Array<string>(instruction.length), updateDataMap: {} })

        const oldInstructionPoints = await this.dbClient.retrieve(
            this.datasetsCollection,
            { ids: updateData.ids }
        )

        const updatedInstructionPoints = new Array<Schemas["PointStruct"]>(instruction.length)

        for (let i = 0; i < oldInstructionPoints.length; i++) {
            const updatedPayload = {
                ...oldInstructionPoints[i].payload,
                ...updateData.updateDataMap[oldInstructionPoints[i].id]
            }

            const updatedInstructionEmbedding = await this.embeddingService.embedText(
                embedInstructionFormat(updatedPayload)
            )

            updatedInstructionPoints[i] = {
                id: oldInstructionPoints[i].id,
                vector: updatedInstructionEmbedding.embedding,
                payload: updatedPayload
            }
        }

        return await this.dbClient.upsert(
            this.datasetsCollection,
            { points: updatedInstructionPoints }
        )
    }

    async search(datasetId: string, text: string): Promise<Instruction[]> {
        const textEmbedding = await this.embeddingService.embedText(text);

        const searchResult = await this.dbClient.search(
            this.datasetsCollection,
            {
                vector: textEmbedding.embedding,
                filter: {
                    must: [
                        {
                            key: "datasetId",
                            match: {
                                value: datasetId,
                            },
                        },
                    ],
                },
                limit: 10
            }
        )

        return searchResult.map(p => p.payload as Instruction)
    }

    async removeInstructions(instructionsIds: string[]) {
        return await this.dbClient.delete(
            this.datasetsCollection,
            { points: instructionsIds.map(id => objectIdToUUID(id)) }
        )
    }

    async clearInstructions(datasetId: string) {
        return await this.dbClient.delete(
            this.datasetsCollection,
            {
                filter: {
                    must: {
                        key: "datasetId",
                        match: { value: datasetId }
                    }
                }
            }
        )
    }
}
