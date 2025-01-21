export type Permission = "inference" | "read" | "write";

export const inferencePermission = "inference"
export const readPermission = "read"
export const writePermission = "write"

export const permissionsArray = [
    inferencePermission,
    readPermission,
    writePermission
] as const