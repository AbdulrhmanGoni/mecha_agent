type ApiKeyStatus = "Active" | "Inactive";

type ApiKeyRecord = {
    id: string;
    key: string;
    keyName: string;
    expirationDate: Date;
    permissions: Permission[];
    status: ApiKeyStatus;
    userEmail: string;
    createdAt: Date;
}

type CreateApiKeyInput = Pick<ApiKeyRecord, "keyName" | "permissions" | "userEmail"> & {
    maxAgeInDays: number;
}