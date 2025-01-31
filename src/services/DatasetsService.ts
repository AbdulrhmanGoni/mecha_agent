import { DatabaseService } from "./DatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { SSEService } from "./SSEService.ts";

export class DatasetsService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly objectStorageService: ObjectStorageService,
        private readonly datasetProcessingWorker: Worker,
        private readonly sseService: SSEService,
    ) {
    }
}
