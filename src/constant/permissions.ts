const permissions = ["inference", "read", "write"] as const

export type Permission = "inference" | "read" | "write";

export default permissions