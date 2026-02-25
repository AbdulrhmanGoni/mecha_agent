type ApiKeyStatus = "Active" | "Inactive";

type ApiKeyRecord = {
    id: string;
    secretHash: string;
    keyName: string;
    expirationDate: Date | null;
    permissions: Permission[];
    status: ApiKeyStatus;
    userEmail: string;
    createdAt: Date;
}

type CreateApiKeyInput =
    Pick<ApiKeyRecord, "keyName" | "permissions" | "userEmail"> &
    { maxAgeInDays?: number }