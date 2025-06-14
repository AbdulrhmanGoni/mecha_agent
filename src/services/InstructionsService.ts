import { VectorDatabaseService } from "./VectorDatabaseService.ts";

export class InstructionsService {
    constructor(private readonly vectorDatabaseService: VectorDatabaseService) { }

    async insert(
        { datasetId, instructions, userEmail }: { datasetId: string, userEmail: string, instructions: NewInstructionInput[] }
    ) {
        const result = await this.vectorDatabaseService.insert({
            datasetId,
            instructions,
            userEmail
        })
        return result.status === "completed"
    }

    async list(datasetId: string, userEmail: string, params: ListInstructionParams) {
        return await this.vectorDatabaseService.list(datasetId, userEmail, params)
    }

    async search(datasetId: string, userEmail: string, params: SearchInstructionParams) {
        return await this.vectorDatabaseService.search(datasetId, userEmail, params)
    }

    async update(instructions: UpdateInstructionInput[]) {
        const result = await this.vectorDatabaseService.update(instructions);
        return result.status === "completed";
    }

    async remove(userEmail: string, instructionsIds: string[]) {
        const result = await this.vectorDatabaseService.remove(userEmail, instructionsIds)
        return result.status === "completed";
    }

    async clear(datasetId: string, userEmail: string) {
        return await this.vectorDatabaseService.clear(datasetId, userEmail)
    }
}