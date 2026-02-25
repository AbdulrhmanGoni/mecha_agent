import { randomUUID } from "node:crypto";
import randomString from "../../../src/helpers/randomString.ts";

export const mockApiKeys: ApiKeyRecord[] = [
    {
        secretHash: randomString(30),
        keyName: "API Key 1",
        id: randomUUID(),
        permissions: ["inference", "read", "write"],
        status: "Active",
        userEmail: "useremail23456@gmail.com",
        createdAt: new Date(),
        expirationDate: new Date(),
    },
    {
        secretHash: randomString(30),
        keyName: "API Key 2",
        id: randomUUID(),
        permissions: ["read", "write"],
        status: "Active",
        userEmail: "useremail23456@gmail.com",
        createdAt: new Date(),
        expirationDate: new Date(),
    },
    {
        secretHash: randomString(30),
        keyName: "API Key 3",
        id: randomUUID(),
        permissions: ["inference"],
        status: "Active",
        userEmail: "useremail23456@gmail.com",
        createdAt: new Date(),
        expirationDate: new Date(),
    },
]

export const newApiKeyInput: Omit<CreateApiKeyInput, "userEmail"> = {
    keyName: "new api key",
    maxAgeInDays: 8,
    permissions: ["read", "write"],
}