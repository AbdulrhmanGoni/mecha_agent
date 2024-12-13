
export default function objectIdToUUID(objectId: string) {
    const isValidHexRegExp = /[0-9a-f]{24}/g;
    if (isValidHexRegExp.test(objectId)) {
        const firstPart = objectId.slice(0, 8)
        return (
            `${firstPart}-` +
            `${objectId.slice(8, 12)}-` +
            `${objectId.slice(12, 16)}-` +
            `${objectId.slice(16, 20)}-` +
            `${objectId.slice(20, 24) + firstPart}`
        )
    }

    return objectId
}
