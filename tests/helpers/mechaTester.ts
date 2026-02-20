import parsedEnvVariables from "../../src/configurations/parseEnvironmentVariables.ts";
import { inferencePermission, readPermission, writePermission } from "../../src/constant/permissions.ts";
import { JwtService } from "../../src/services/JwtService.ts";

const jwtService = new JwtService();
await jwtService.init();

export class MechaTester {
    constructor(private userEmail: string) { }

    get(endpoint: string) {
        return new MechaRequest(this.userEmail, endpoint, "GET")
    }

    post(endpoint: string) {
        return new MechaRequest(this.userEmail, endpoint, "POST")
    }

    patch(endpoint: string) {
        return new MechaRequest(this.userEmail, endpoint, "PATCH")
    }

    delete(endpoint: string) {
        return new MechaRequest(this.userEmail, endpoint, "DELETE")
    }
}

class MechaRequest {
    private _url: string = `http://localhost:${parsedEnvVariables.SERVER_PORT}`;
    private _headers: Record<string, string> | undefined;
    private _body: RequestInit["body"] | undefined;

    constructor(private userEmail: string, private _endpoint: string, private _method: string) { }

    json(body: Record<string, unknown> | Array<unknown>) {
        this._body = JSON.stringify(body)
        this._headers = { ...this._headers, "Content-Type": "application/json" }
        return this
    }

    body(body: RequestInit["body"]) {
        this._body = body
        return this
    }

    headers(headers: Record<string, string>) {
        this._headers = { ...this._headers, ...headers }
        return this
    }

    async send() {
        const { jwt } = await jwtService.generateJwt({
            maxAgeInDays: 1,
            permissions: [readPermission, writePermission, inferencePermission],
            userEmail: this.userEmail,
        });

        const response = await fetch(this._url + this._endpoint, {
            method: this._method,
            headers: {
                ...this._headers,
                Authorization: `Bearer ${jwt}`
            },
            body: this._body,
        })

        return new MechaResponse(response)
    }
}

class MechaResponse {
    constructor(private response: Response) { }

    async json<T>() {
        return await this.response.json() as T
    }

    get object() {
        return this.response
    }

    get body() {
        return this.response.body
    }

    get headers() {
        return this.response.headers
    }
}