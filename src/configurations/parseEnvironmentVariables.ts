import z from "zod";

function parseEnvironmentVariables<
    T extends z.ZodObject<z.ZodRawShape, z.UnknownKeysParam, z.ZodTypeAny>,
>(schema: T): z.infer<typeof schema> {
    const vars: Record<string, string | undefined> = {};
    for (const key in schema._def.shape()) {
        vars[key] = Deno.env.get(key);
    }

    return schema.parse(vars);
};

const envSchema = z.object({
    ENVIRONMENT: z.enum(["testing", "production", "development"]),

    GEMINI_API_KEY: z.string().optional(),

    SERVER_PORT: z.coerce.number().default(10000),

    DB_PORT: z.coerce.number().optional(),
    DB_HOST: z.string(),
    DB_NAME: z.string(),
    DB_USERNAME: z.string(),
    DB_PASSWORD: z.string(),
    DB_REQUIRE_SSL_MODE: z.string().optional(),

    VECTOR_DB_PORT: z.coerce.number().optional(),
    VECTOR_DB_HOST: z.string(),
    VECTOR_DB_API_KEY: z.string().optional(),

    OBJECT_STORAGE_DB_PORT: z.coerce.number().optional(),
    OBJECT_STORAGE_DB_HOST: z.string(),
    OBJECT_STORAGE_USERNAME: z.string(),
    OBJECT_STORAGE_PASSWORD: z.string(),
    OBJECT_STORAGE_SSL: z.string().optional(),

    OLLAMA_HOST: z.string().optional(),

    MODEL_NAME: z.string().default("qwen2.5:3b-instruct"),
    EMBEDDING_MODEL_NAME: z.string().default("all-minilm:l6-v2"),

    JWT_SECRET_KEY: z.string(),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    PRO_SUBSCRIPTION_PRICE_ID: z.string().optional(),
    SUCCESSFUL_SUBSCRIPTION_REDIRECT_URL: z.string().optional(),
    CANCEL_SUBSCRIPTION_REDIRECT_URL: z.string().optional(),

    SENTRY_DSN: z.string().optional(),

    MAIL_SENDER_HOST: z.string().optional(),
    MAIL_SENDER_PORT: z.string().optional(),
    MAIL_SENDER_USER: z.string(),
    MAIL_SENDER_PASS: z.string(),
    MAIL_SENDER_KEY: z.string().optional(),
});

const parsedEnvVariables = parseEnvironmentVariables(envSchema);

export default parsedEnvVariables