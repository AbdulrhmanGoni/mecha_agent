type Dataset = {
    id: string;
    agentId: string;
    userEmail: string;
    title: string;
    description: string;
    status: "processing" | "processed" | "unprocessed";
    createdAt: string;
}

type CreateDatasetInput = Pick<Dataset, "title" | "description" | "agentId"> & {
    datasetFile: File;
}

type UpdateDatasetInput = Partial<Pick<Dataset, "title" | "description" | "status">>

type BaseInstruction = {
    systemMessage?: string;
    prompt: string;
    response: string;
}

type Instruction = BaseInstruction & {
    id: string;
    datasetId: string;
    userEmail: string;
}

type InstructionInput = Omit<Instruction, "userEmail">;

type UpdateInstructionInput = (WithOptionalFields<Instruction, "response" | "prompt">);

type DatasetProcessingWorkerTask = "new_dataset" | "delete_dataset" | "successful_process" | "failed_process"

type DatasetProcessingWorkerEvent = MessageEvent<{ process: DatasetProcessingWorkerTask; payload: unknown }>