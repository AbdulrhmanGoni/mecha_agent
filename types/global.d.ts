type LogInInput = {
    username: string;
    password: string;
}

type WithOptionalFields<Obj, Keys extends keyof Obj> = Omit<Obj, Keys> & Partial<Pick<Obj, Keys>>;

type Permission = import("../src/constant/permissions.ts").Permission

type CreateJWTOptions = {
    maxAgeInDays: number;
    permissions: Permission[];
    user: string,
}

type JWTPayload = import("djwt").Payload

type VerifyJwtResponse = {
    payload?: JWTPayload & Pick<CreateJWTOptions, "permissions" | "user">
    errorMessage?: string;
}

type ObjectReadable = import("node:stream").Readable & { headers?: Record<string, string> }

type SSEEvent = "dataset-status";

type SSESubscriber = Record<string, { subscriberChannel: ReadableStreamDefaultController, subscriberId: string }>
