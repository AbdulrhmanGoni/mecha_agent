import { VectorDatabaseService } from "./VectorDatabaseService.ts";

export class InstructionsService {
    constructor(private readonly vectorDatabaseService: VectorDatabaseService) { }

    async insertInstructions(instructions: InstructionInput[]) {
        return await this.vectorDatabaseService.insertInstructions(instructions)
    }

    async updateInstructions(instructions: UpdateInstructionInput[]) {
        return await this.vectorDatabaseService.updateInstructions(instructions)
    }

    async removeInstructions(instructionsIds: string[]) {
        return await this.vectorDatabaseService.removeInstructions(instructionsIds)
    }

    async clearInstructions(datasetId: string) {
        return await this.vectorDatabaseService.clearInstructions(datasetId)
    }
}