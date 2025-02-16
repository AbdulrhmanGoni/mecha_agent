import { validator } from 'hono/validator'
import schemaParser from "../../helpers/schemaParser.ts";
import { z } from "zod";
import signInSchema from "./signInSchema.ts";

const signUpSchema = z.object<Record<keyof SignUpUserInput, z.ZodType>>({
    password: signInSchema.shape.password,
    email: signInSchema.shape.email,
    signingMethod: signInSchema.shape.signingMethod,
    username: z.string().min(3).max(70),
    avatar: z.string().url().optional(),
})

const signUpValidator = validator('json', (value, c) => {
    return schemaParser<typeof signUpSchema.shape>(
        c,
        signUpSchema,
        value
    );
})

export default signUpValidator;
