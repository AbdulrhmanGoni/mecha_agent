import z from "npm:zod@3";

const chatIdValidator = z.string().uuid({ message: "chat id must be a valid UUID" })

export default chatIdValidator;
