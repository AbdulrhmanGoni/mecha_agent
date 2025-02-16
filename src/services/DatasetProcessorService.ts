import { csvRowParser } from "../helpers/csvRowParser.ts";
import { jsonLineParser } from "../helpers/jsonLineParser.ts";
import { readFileLineByLine } from "../helpers/readFileLineByLine.ts";
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

    async processDataset(dataset: Dataset) {
        const readableDataset = await this.objectStorageService.getFile(
            this.objectStorageService.buckets.datasets,
            dataset.id
        );
        const fileType = readableDataset.headers?.["content-type"] as string;
        const userEmailHeader = readableDataset.headers?.["x-amz-meta-user-email"]

        if (userEmailHeader !== dataset.userEmail) {
            return false
        }

        const parser = this.parsers[fileType];

        const processDatasetFileLine = function (this: DatasetProcessorService, line: string, lineNumber?: number) {
            const baseInstruction = parser(line, lineNumber);
            if (baseInstruction) {
                const instruction = {
                    id: crypto.randomUUID(),
                    datasetId: dataset.id,
                    userEmail: dataset.userEmail,
                    ...baseInstruction,
                }

                this.vectorDatabaseService.insert([instruction]);
            }
        }

        const readingResult = await readFileLineByLine(readableDataset, {
            onLine: processDatasetFileLine.bind(this)
        })
            .then(() => true)
            .catch(() => {
                this.vectorDatabaseService.clear(dataset.id, dataset.userEmail);
                return false
            })

        return readingResult
    }

    async deleteDataset(datasetId: string, userEmail: string) {
        await this.objectStorageService.deleteFile(
            this.objectStorageService.buckets.datasets,
            datasetId
        );;
        await this.vectorDatabaseService.clear(datasetId, userEmail);
    }
}
