import { z } from "zod";
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

export default avatarFieldValidator