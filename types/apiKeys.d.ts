type ApiKeyStatus = "Active" | "Inactive";

type ApiKeyRecord = {
    id: string;
    key: string;
    keyName: string;
    expirationDate: string;
    permissions: Permission[];
    status: ApiKeyStatus;
    createdAt: Date;
}
