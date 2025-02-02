import z from "npm:zod@3";

const agentIdValidator = z.string().uuid({ message: "agent id must be a valid UUID" })

export default agentIdValidator;
