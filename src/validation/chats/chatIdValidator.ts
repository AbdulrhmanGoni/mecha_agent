import z from "zod";

const chatIdValidator = z.string().uuid({ message: "chat id must be a valid UUID" })

export default chatIdValidator;
