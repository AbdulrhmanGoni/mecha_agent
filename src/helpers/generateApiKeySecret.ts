import crypto from "node:crypto";

export default function generateApiKeySecret(length: number = 46) {
    return crypto.randomBytes(length).toString("base64url")
}