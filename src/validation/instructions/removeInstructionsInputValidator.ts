import { z } from 'zod';
import { validator } from 'hono/validator';
import schemaParser from "../../helpers/schemaParser.ts";

const instructionIdValidator = z.string({ message: "instruction id must be string" });

const removeInstructionsInputValidator = validator('json', (value, c) => {
    const removeInstructionsInputSchema = z
        .array(instructionIdValidator)
        .nonempty("Specify at least one instruction to delete");

    return schemaParser(
        c,
        removeInstructionsInputSchema,
        value,
        (message, issues) => `${message} ${issues.message} at: index ${issues.path}\n`
    )
})
export default removeInstructionsInputValidator;
