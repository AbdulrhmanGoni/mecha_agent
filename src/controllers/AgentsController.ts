import { Context } from "hono";
import { AgentsService } from "../services/AgentsService.ts";
import AgentsResponseMessages from "../constant/response-messages/agentsResponsesMessages.ts";

export class AgentsController {
    constructor(private agentsService: AgentsService) { }

    async create(c: Context<never, never, { out: { form: CreateAgentFormData } }>) {
        const formData = c.req.valid("form");
        const result = await this.agentsService.create(formData);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentCreation }, 201);
        }

        return c.json({ error: AgentsResponseMessages.failedAgentCreation }, 404);
    }

    async getOne(c: Context) {
        const agentId = c.req.param("agentId");
        const result = await this.agentsService.getOne(agentId);

        if (result) {
            return c.json({ result }, 200);
        }

        return c.json({ error: AgentsResponseMessages.notFoundAgent }, 404);
    }

    async getAll(c: Context) {
        const result = await this.agentsService.getAll();
        return c.json({ result }, 200);
    }

    async delete(c: Context) {
        const agentId = c.req.param("agentId");
        const result = await this.agentsService.delete(agentId);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentDeletion }, 200);
        }

        return c.json({ error: AgentsResponseMessages.failedAgentDeletion }, 404);
    }

    async update(c: Context<never, never, { out: { form: UpdateAgentFormData } }>) {
        const agentId = c.req.param("agentId") as string;
        const updateData = c.req.valid("form");
        const result = await this.agentsService.update(agentId, updateData);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentUpdate }, 200);
        }

        return c.json({ error: AgentsResponseMessages.failedAgentUpdate }, 404);
    }
}

