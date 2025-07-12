import { QdrantClient } from "npm:@qdrant/js-client-rest";
import { Schemas } from "npm:@qdrant/js-client-rest";
import { EmbeddingService } from "./EmbeddingService.ts";
import embedInstructionFormat from "../helpers/embedInstructionFormat.ts";
import { datasetsCollection } from "../constant/vectorDB.ts";

export class VectorDatabaseService {
    private readonly datasetsCollection = datasetsCollection;

    constructor(
        private readonly dbClient: QdrantClient,
        private readonly embeddingService: EmbeddingService,
    ) { }

    async insert(
        { datasetId, instructions, userEmail }: { datasetId: string, userEmail: string, instructions: NewInstructionInput[] }
    ) {
        const points = new Array<Schemas["PointStruct"]>(instructions.length)

        for (let i = 0; i < instructions.length; i++) {
            const instructionEmbedding = await this.embeddingService.embedText(
                embedInstructionFormat(instructions[i])
            )

            const currentDate = new Date().getTime();

            points[i] = {
                id: crypto.randomUUID(),
                vector: instructionEmbedding,
                payload: {
                    ...instructions[i],
                    userEmail,
                    datasetId,
                    createdAt: currentDate,
                    updatedAt: currentDate,
                }
            }
        }

        return await this.dbClient.upsert(this.datasetsCollection, { points, wait: true })
    }

    async list(datasetId: string, userEmail: string, params: ListInstructionParams) {
        const result = await this.dbClient.query(this.datasetsCollection, {
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
                ]
            },
            limit: params.pageSize,
            offset: params.page * params.pageSize,
            with_payload: true,
        })

        return result.points.map((point) => {
            return {
                id: point.id,
                prompt: point.payload?.prompt,
                response: point.payload?.response,
                createdAt: point.payload?.createdAt,
                updatedAt: point.payload?.updatedAt,
            } as Instruction
        })
    }

    async count(datasetId: string, userEmail: string) {
        const result = await this.dbClient.count(this.datasetsCollection, {
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
                ]
            },
        })

        return result.count
    }

    async update(instructions: UpdateInstructionInput[]) {
        type UpdatePreparation = { ids: Array<string>, updateDataMap: Record<string, Omit<UpdateInstructionInput, "id">> }
        const updateData = instructions.reduce<UpdatePreparation>((updateData, instruction, i) => {
            const { id, ...instructionData } = instruction
            updateData.updateDataMap[id] = instructionData;
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
                ...updateData.updateDataMap[oldInstructionsPoints[i].id],
                updatedAt: new Date().getTime(),
            }

            const updatedInstructionEmbedding = await this.embeddingService.embedText(
                embedInstructionFormat(updatedPayload as Instruction)
            )

            updatedInstructionsPoints[i] = {
                id: oldInstructionsPoints[i].id,
                vector: updatedInstructionEmbedding,
                payload: updatedPayload
            }
        }

        return await this.dbClient.upsert(
            this.datasetsCollection,
            { points: updatedInstructionsPoints, wait: true }
        )
    }

    async search(datasetId: string, userEmail: string, params: SearchInstructionParams & { forLLM?: boolean }): Promise<Instruction[]> {
        const textEmbedding = await this.embeddingService.embedText(params.searchText);

        const searchResult = await this.dbClient.search(
            this.datasetsCollection,
            {
                vector: textEmbedding,
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
                limit: params.pageSize,
                offset: params.pageSize * params.page,
            }
        )

        if (params.forLLM) {
            return searchResult.map(p => p.payload as Instruction)
        }

        return searchResult.map(point => ({
            id: point.id,
            prompt: point.payload!.prompt,
            response: point.payload!.response,
            createdAt: point.payload!.createdAt,
            updatedAt: point.payload!.updatedAt,
        }) as Instruction)
    }

    async remove(userEmail: string, instructionsIds: string[]) {
        return await this.dbClient.delete(
            this.datasetsCollection,
            {
                points: instructionsIds,
                filter: {
                    must: {
                        key: "userEmail",
                        match: { value: userEmail },
                    }
                },
                wait: true
            }
        )
    }

    private async clear(options: { userEmail: string, datasetId?: string }) {
        const filter = Object
            .entries(options)
            .map(([key, value]) => ({ key, match: { value } }))

        return await this.dbClient.delete(
            this.datasetsCollection,
            { filter: { must: filter } }
        )
    }

    async clearDatasetInstructions(datasetId: string, userEmail: string) {
        return await this.clear({ userEmail, datasetId });
    }

    async clearUserInstructions(userEmail: string) {
        return await this.clear({ userEmail });
    }
}
