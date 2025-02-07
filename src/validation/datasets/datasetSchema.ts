import { z } from "zod";
import { supportedDatasetFileTypes } from "../../constant/supportedFileTypes.ts";
import agentIdValidator from "../agents/agentIdValidator.ts";

const datasetFileValidator = z
    .instanceof(File)
    .refine((file) => file.size && file.name, { message: "Invalid file" })
    .refine(
        (file) => supportedDatasetFileTypes.some((extention) => file.type.endsWith(extention)),
        (file) => ({
            message: `Not supported file type '${file.type}', The supported types are: ${supportedDatasetFileTypes.join(', ')}`
        })
    )

const datasetSchema = z.object({
    title: z.string().max(70),
    description: z.string().max(150),
    agentId: agentIdValidator,
    datasetFile: datasetFileValidator,
})

export default datasetSchema