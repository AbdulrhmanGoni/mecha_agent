type LogInInput = {
    username: string;
    password: string;
}

type WithOptionalFields<Obj, Keys extends keyof Obj> = Omit<Obj, Keys> & Partial<Pick<Obj, Keys>>;

type Permission = import("../src/constant/permissions.ts").Permission

type CreateJWTParams = {
    maxAgeInDays: number;
    permissions: Permission[];
    userEmail: User["email"];
}

type JWTPayload = import("djwt").Payload

type VerifyJwtResponse = {
    payload?: JWTPayload & Omit<CreateJWTParams, "maxAgeInDays">
    errorMessage?: string;
}

type ObjectReadable = import("node:stream").Readable & { headers?: Record<string, string> }

type SSEEvent = "dataset-status";

type SSESubscriber = Record<string, { subscriberChannel: ReadableStreamDefaultController, subscriberId: string }>
