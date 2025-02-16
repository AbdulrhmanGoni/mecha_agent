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
        if (!collectionExists.exists) {
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

            await this.dbClient.createPayloadIndex(this.datasetsCollection, {
                field_name: "userEmail",
                field_schema: {
                    type: "keyword",
                    is_tenant: true,
                },
            })
        }
    }

    async insert(instructions: InstructionInput[]) {
        const points = new Array<Schemas["PointStruct"]>(instructions.length)

        for (let i = 0; i < instructions.length; i++) {
            const instructionEmbedding = await this.embeddingService.embedText(
                embedInstructionFormat(instructions[i])
            )

            points[i] = {
                id: objectIdToUUID(instructions[i].id),
                vector: instructionEmbedding.embedding,
                payload: instructions[i]
            }
        }

        return await this.dbClient.upsert(this.datasetsCollection, { points })
    }

    async update(instructions: UpdateInstructionInput[]) {
        const updateData = instructions.reduce<{ ids: Array<string>, updateDataMap: Record<string, UpdateInstructionInput> }>((updateData, instruction, i) => {
            const id = objectIdToUUID(instruction.id)
            updateData.updateDataMap[id] = instruction;
            updateData.ids[i] = id;
            return updateData;
        }, { ids: new Array<string>(instructions.length), updateDataMap: {} })

        const oldInstructionsPoints = await this.dbClient.retrieve(
            this.datasetsCollection,
            { ids: updateData.ids }
        )

        const updatedInstructionsPoints = new Array<Schemas["PointStruct"]>(instructions.length)

        for (let i = 0; i < oldInstructionsPoints.length; i++) {
            const updatedPayload = {
                ...oldInstructionsPoints[i].payload,
                ...updateData.updateDataMap[oldInstructionsPoints[i].id]
            }

            const updatedInstructionEmbedding = await this.embeddingService.embedText(
                embedInstructionFormat(updatedPayload)
            )

            updatedInstructionsPoints[i] = {
                id: oldInstructionsPoints[i].id,
                vector: updatedInstructionEmbedding.embedding,
                payload: updatedPayload
            }
        }

        return await this.dbClient.upsert(
            this.datasetsCollection,
            { points: updatedInstructionsPoints }
        )
    }

    async search(
        { text, datasetId, userEmail }:
            { datasetId: string, userEmail: string, text: string }
    ): Promise<Instruction[]> {
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
                        {
                            key: "userEmail",
                            match: { value: userEmail },
                        },
                    ],
                },
                limit: 10
            }
        )

        return searchResult.map(p => p.payload as Instruction)
    }

    async remove(userEmail: string, instructionsIds: string[]) {
        return await this.dbClient.delete(
            this.datasetsCollection,
            {
                points: instructionsIds.map(id => objectIdToUUID(id)),
                filter: {
                    must: {
                        key: "userEmail",
                        match: { value: userEmail },
                    }
                }
            }
        )
    }

    async clear(datasetId: string, userEmail: string) {
        return await this.dbClient.delete(
            this.datasetsCollection,
            {
                filter: {
                    must: [
                        {
                            key: "datasetId",
                            match: { value: datasetId },
                        },
                        {
                            key: "userEmail",
                            match: { value: userEmail },
                        }
                    ],
                }
            }
        )
    }
}
