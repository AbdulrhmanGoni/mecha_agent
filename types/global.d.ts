type WithOptionalFields<Obj, Keys extends keyof Obj> = Omit<Obj, Keys> & Partial<Pick<Obj, Keys>>;

type VerifyJwtResponse<T> = {
    payload?: T;
    errorMessage?: string;
}