type WithOptionalFields<Obj, Keys extends keyof Obj> = Omit<Obj, Keys> & Partial<Pick<Obj, Keys>>;

type CreateJWTOptions = {
    maxAgeInDays: number;
    permissions: Permission[];
    user: string,
}

type JWTPayload = import("deno.land/x/djwt").Payload

type VerifyJwtResponse = {
    payload?: JWTPayload & Pick<CreateJWTOptions, "permissions" | "user">
    errorMessage?: string;
}