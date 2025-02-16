import { VectorDatabaseService } from "./VectorDatabaseService.ts";

export class InstructionsService {
    constructor(private readonly vectorDatabaseService: VectorDatabaseService) { }

    async insert(instructions: InstructionInput[]) {
        return await this.vectorDatabaseService.insert(instructions)
    }

    async update(instructions: UpdateInstructionInput[]) {
        return await this.vectorDatabaseService.update(instructions)
    }

    async remove(userEmail: string, instructionsIds: string[]) {
        return await this.vectorDatabaseService.remove(userEmail, instructionsIds)
    }

    async clear(datasetId: string, userEmail: string) {
        return await this.vectorDatabaseService.clear(datasetId, userEmail)
    }
}