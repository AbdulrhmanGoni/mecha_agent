import { z, ZodRawShape } from "npm:zod@3";
import { Context } from "npm:hono";

export default function schemaParser<SchemaT extends ZodRawShape, ValuesT = string>(
    c: Context,
    schema: z.ZodObject<SchemaT> | z.ZodArray<(z.ZodObject<SchemaT> | z.ZodString), "many" | "atleastone">,
    value: Record<string, ValuesT> | Record<string, ValuesT>[],
    errorMessageFormatter?: (message: string, issues: z.ZodIssue) => string
) {
    const parsed = schema.safeParse(value)
    if (!parsed.success) {
        const errorMessage = parsed.error.issues.reduce(
            errorMessageFormatter ? errorMessageFormatter :
                (message, issues) => (
                    `${message} ${issues.path.length ? `'${issues.path.join(".")}' field: ` : ""}${issues.message}\n`
                ),
            ""
        );
        return c.json({ error: errorMessage }, 400)
    }

    return parsed.data
};
