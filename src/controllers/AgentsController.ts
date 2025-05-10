import { Context } from "hono";
import { AgentsService } from "../services/AgentsService.ts";
import AgentsResponseMessages from "../constant/response-messages/agentsResponsesMessages.ts";

export class AgentsController {
    constructor(private agentsService: AgentsService) { }

    async create(c: Context<{ Variables: { userEmail: string } }, never, { out: { form: CreateAgentFormData } }>) {
        const formData = c.req.valid("form");
        const userEmail = c.get("userEmail");
        const { success, limitReached } = await this.agentsService.create(userEmail, formData);

        if (success) {
            return c.json({ result: AgentsResponseMessages.successfulAgentCreation }, 201);
        }

        return c.json(
            { error: limitReached ? AgentsResponseMessages.agentsLimitReached : AgentsResponseMessages.failedAgentCreation },
            400
        );
    }

    async getOne(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const userEmail = c.get("userEmail");
        const isPublishedAgent = c.req.query("published") === "yes";

        const result =
            isPublishedAgent ?
                await this.agentsService.getPublishedAgent(agentId) :
                await this.agentsService.getOne(agentId, userEmail);

        if (result) {
            return c.json({ result }, 200);
        }

        return c.json({ error: AgentsResponseMessages.notFoundAgent }, 404);
    }

    async getAll(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const result = await this.agentsService.getAll(userEmail);
        return c.json({ result }, 200);
    }

    async delete(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const userEmail = c.get("userEmail");
        const result = await this.agentsService.delete(agentId, userEmail);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentDeletion }, 200);
        }

        if (result === null) {
            return c.json({ error: `${AgentsResponseMessages.failedAgentDeletion}: ${AgentsResponseMessages.noAgentOrUser}` }, 404);
        }

        return c.json({ error: AgentsResponseMessages.failedAgentDeletion }, 400);
    }

    async update(c: Context<{ Variables: { userEmail: string } }, never, { out: { form: UpdateAgentFormData } }>) {
        const agentId = c.req.param("agentId") as string;
        const updateData = c.req.valid("form");
        const userEmail = c.get("userEmail");

        if (!Object.keys(updateData).length) {
            return c.json({ error: AgentsResponseMessages.noUpdateData }, 400);
        }

        const result = await this.agentsService.update(agentId, userEmail, updateData);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentUpdate }, 200);
        }

        if (result === null) {
            return c.json(
                { error: `${AgentsResponseMessages.failedAgentUpdate}, ${AgentsResponseMessages.noAgentOrUser}` },
                404
            );
        }

        return c.json({ error: AgentsResponseMessages.failedAgentUpdate }, 400);
    }
}

