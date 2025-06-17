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


type QueryInstructionParams = {
    datasetId: string,
    searchText: string,
    page: number,
    pageSize: number,
}

type SearchInstructionParams = Pick<QueryInstructionParams, "page" | "pageSize" | "searchText">

type ListInstructionParams = Pick<QueryInstructionParams, "page" | "pageSize">

type UpdateInstructionInput = WithOptionalFields<Pick<Instruction, "id" | "prompt" | "response">, "prompt" | "response">
