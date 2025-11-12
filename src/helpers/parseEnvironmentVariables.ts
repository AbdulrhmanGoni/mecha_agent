import z from "zod";

export function parseEnvironmentVariables<
    T extends z.ZodObject<z.ZodRawShape, z.UnknownKeysParam, z.ZodTypeAny>,
>(schema: T): z.infer<typeof schema> {
    const vars: Record<string, string | undefined> = {};
    for (const key in schema.shape) {
        vars[key] = Deno.env.get(key);
    }

    return schema.parse(vars);
};