import { z } from "zod";
import { responseSyntaxes } from "../../constant/responseSyntaxes.ts";
import { supportedImageTypes } from "../../constant/supportedFileTypes.ts";

const avatarFieldValidator = z
    .instanceof(File)
    .refine((file) => file.size && file.name, { message: "Invalid file" })
    .refine(
        (file) => supportedImageTypes.some((extention) => file.type.endsWith(extention)),
        (file) => ({
            message: `Not supported file type (${file.type}), Please use images with ${supportedImageTypes.join(', ')} extentions`
        })
    )
    .optional()

const agentSchema = z.object({
    agentName: z.string().max(40),
    description: z.string().max(100),
    avatar: avatarFieldValidator,
    systemInstructions: z.string().max(10000).optional(),
    dontKnowResponse: z.string().max(100).optional(),
    greetingMessage: z.string().max(80).optional(),
    responseSyntax: z.enum(responseSyntaxes).optional(),
})

export default agentSchema