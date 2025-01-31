type Dataset = {
    id: string;
    agentId: string;
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
}

type InstructionInput = Instruction;

type UpdateInstructionInput = WithOptionalFields<Instruction, "response" | "prompt">;

type DatasetProcessingWorkerTask = "new_dataset" | "delete_dataset" | "successful_process" | "failed_process"

type DatasetProcessingWorkerEvent = MessageEvent<{ process: DatasetProcessingWorkerTask; payload: any }>