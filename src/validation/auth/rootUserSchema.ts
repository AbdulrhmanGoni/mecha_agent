import { z } from "zod";

const rootUserSchema = z.object({
    username: z.string().min(3).max(70),
    password: z.string().min(6).max(200),
})

export default rootUserSchema