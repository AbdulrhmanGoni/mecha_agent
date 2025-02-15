type ApiKeyStatus = "Active" | "Inactive";

type ApiKeyRecord = {
    id: string;
    key: string;
    keyName: string;
    expirationDate: string;
    permissions: Permission[];
    status: ApiKeyStatus;
    userEmail: string;
    createdAt: Date;
}

type CreateApiKeyInput = Pick<ApiKeyRecord, "keyName" | "permissions" | "userEmail"> & {
    maxAgeInDays: number;
}