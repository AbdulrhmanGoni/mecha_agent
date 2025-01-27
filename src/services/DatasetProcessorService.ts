import { csvRowParser } from "../helpers/csvRowParser.ts";
import { jsonLineParser } from "../helpers/jsonLineParser.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";
import { VectorDatabaseService } from "./VectorDatabaseService.ts";

export class DatasetProcessorService {
    private parsers: Record<string, (line: string, lineNumber?: number) => BaseInstruction | null> = {
        "application/jsonl": jsonLineParser,
        "text/csv": csvRowParser,
    }

    constructor(
        private readonly objectStorageService: ObjectStorageService,
        private readonly vectorDatabaseService: VectorDatabaseService,
    ) { }

}
