type Dataset = {
    id: string;
    agentId: string;
    userEmail: string;
    title: string;
    description: string;
    status: "processing" | "processed" | "unprocessed";
    createdAt: string;
}

type CreateDatasetInput = Pick<Dataset, "title" | "description">

type UpdateDatasetInput = Partial<Pick<Dataset, "title" | "description">>

type Instruction = {
    id: string;
    datasetId: string;
    userEmail: string;
    prompt: string;
    response: string;
    createdAt: number;
    updatedAt: number;
}

type NewInstructionInput = Pick<Instruction, "prompt" | "response">;



type UpdateInstructionInput = WithOptionalFields<Pick<Instruction, "id" | "prompt" | "response">, "prompt" | "response">

type DatasetProcessingWorkerTask = "new_dataset" | "delete_dataset" | "successful_process" | "failed_process"

type DatasetProcessingWorkerEvent = MessageEvent<{ process: DatasetProcessingWorkerTask; payload: unknown }>