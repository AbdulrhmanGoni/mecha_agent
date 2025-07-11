/// <reference lib="deno.unstable" />

type WithOptionalFields<Obj, Keys extends keyof Obj> = Omit<Obj, Keys> & Partial<Pick<Obj, Keys>>;

type Permission = import("../src/constant/permissions.ts").Permission

type CreateJWTParams = {
    maxAgeInDays: number;
    permissions: Permission[];
    userEmail: User["email"];
}

type JWTPayload = import("djwt").Payload

type VerifyJwtResponse = {
    payload?: JWTPayload & Omit<CreateJWTParams, "maxAgeInDays"> & { apiKeyId?: string }
    errorMessage?: string;
}

type ObjectReadable = import("node:stream").Readable & { headers?: Record<string, string> }

type SSEEvent = "dataset-status";

type SSESubscriber = Record<string, { subscriberChannel: ReadableStreamDefaultController, subscriberId: string }>

type BackgroundTaskMessage =
    { task: "delete-expired-anonymous-chats" }
    |
    { task: "reset-users-inferences-rate-limits" }
    |
    {
        task: "delete_dataset_instructions";
        payload: { userEmail: string, datasetId: string }
    }
