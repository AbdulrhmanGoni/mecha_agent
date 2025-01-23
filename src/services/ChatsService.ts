import { DatabaseService } from "./DatabaseService.ts";
import { LLMService } from "./LLMService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";

export class ChatsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly vectorDatabaseService: VectorDatabaseService,
        private readonly llmService: LLMService,
    ) { }

}
