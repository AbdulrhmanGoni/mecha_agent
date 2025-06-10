import { z } from "zod";

const datasetSchema = z.object({
    title: z.string().max(70),
    description: z.string().max(150),
})

export default datasetSchema