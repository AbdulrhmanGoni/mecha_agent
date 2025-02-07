import z from "zod";

const agentIdValidator = z.string().uuid({ message: "agent id must be a valid UUID" })

export default agentIdValidator;
