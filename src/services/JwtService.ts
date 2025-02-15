import { create, verify, getNumericDate, Header, Payload } from "djwt";
import parsedEnvVariables from "../configurations/parseEnvironmentVariables.ts";
import genDateAfterNDays from "../helpers/genDateAfterNDays.ts";

export class JwtService {
    private JWT_SECRET_CRYPTO_KEY: CryptoKey | null = null;

    constructor() { }

    async init() {
        const encoder = new TextEncoder();
        const keyBuf = encoder.encode(parsedEnvVariables.JWT_SECRET_KEY);
        this.JWT_SECRET_CRYPTO_KEY = await crypto.subtle.importKey(
            "raw",
            keyBuf,
            { name: "HMAC", hash: "SHA-512" },
            true,
            ["sign", "verify"],
        )
    }

    async generateJwt(options: CreateJWTParams) {
        const expirationDate = genDateAfterNDays(options.maxAgeInDays);
        const payload: Payload = {
            exp: getNumericDate(expirationDate),
            permissions: options.permissions,
            email: options.userEmail
        };

        const header: Header = { alg: "HS512", typ: "JWT", };

        const jwt = await create(header, payload, this.JWT_SECRET_CRYPTO_KEY);

        return {
            jwt,
            expirationDate
        }
    }

    async verifyJwt(token: string): Promise<VerifyJwtResponse> {
        try {
            const payload = await verify<Required<VerifyJwtResponse>["payload"]>(token, this.JWT_SECRET_CRYPTO_KEY);
            return { payload };
        } catch (error) {
            const e = error as Error
            return { errorMessage: e.message };
        }
    }
}
