import objectIdToUUID from "../../src/helpers/objectIdToUUID.ts";
import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { uuidMatcher } from "../helpers/uuidMatcher.ts";

export default function objectIdToUUID_test() {
    it("Should convert the ObjectId to a valid UUID", () => {
        const mockInstructionId = "66b6426ee5e71a872c338770"
        const mockInstructionIdAsUUID = "66b6426e-e5e7-1a87-2c33-877066b6426e"
        const result = objectIdToUUID(mockInstructionId);
        expect(result).toBe(mockInstructionIdAsUUID);
        expect(result).toMatch(uuidMatcher);
    });

    it("Should return the same input without any conversion because it is an invalid ObjectId", () => {
        const invalidMockInstructionId = "66o6426xx5x71i872i338ttt" // invalid hex string (ObjectId)
        const result = objectIdToUUID(invalidMockInstructionId);
        expect(result).toBe(invalidMockInstructionId);
    });
};
