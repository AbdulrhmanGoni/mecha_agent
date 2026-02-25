export const inferencePermission = "inference"
export const readPermission = "read"
export const writePermission = "write"

const permissionsSet = [
    inferencePermission,
    readPermission,
    writePermission
] as const

export const apiKeysPermissions = [
    inferencePermission,
    readPermission,
    writePermission
] as const

export type Permission = typeof permissionsSet[number];
