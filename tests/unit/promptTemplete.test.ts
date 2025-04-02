import promptTemplate from "../../src/helpers/promptTemplate.ts";
import { getRandomMockInstruction } from "../mock/data/mockInstructions.ts";
import { it } from "@std/testing/bdd";
import { expect } from "@std/expect";

export default function promptTemplete_test() {
    it("Should create the prompt template that includes the Context and Prompt plus any additional system messages", () => {
        const prompt = "Testing prompt";
        const mockInstruction: Instruction = getRandomMockInstruction();
        const result = promptTemplate([mockInstruction], prompt)
        expect(result).toBe("### Context: " +
            `"${mockInstruction.systemMessage ? mockInstruction.systemMessage + "; " : ""}` +
            `${mockInstruction.response}", \n### Prompt: ${prompt}`);
    });
};
