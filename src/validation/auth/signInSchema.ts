import { z } from "zod";

const signInSchema = z.object<Record<keyof SignInUserInput, z.ZodType>>({
    password: z.string().min(6).max(200),
    email: z.string().email(),
    signingMethod: z.enum(["github", "google", "credentials"]),
});

export default signInSchema;