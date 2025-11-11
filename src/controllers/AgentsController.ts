import { Context } from "hono";
import { AgentsService } from "../services/AgentsService.ts";
import AgentsResponseMessages from "../constant/response-messages/agentsResponsesMessages.ts";

export class AgentsController {
    constructor(private agentsService: AgentsService) { }

    async create(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: CreateAgentFormData } }>) {
        const formData = c.req.valid("json");
        const userEmail = c.get("userEmail");
        const result = await this.agentsService.create(userEmail, formData);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentCreation }, 201);
        }

        return c.json({ error: AgentsResponseMessages.failedAgentCreation }, 400);
    }

    async getOne(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const userEmail = c.get("userEmail");
        const isPublishedAgent = c.req.query("published") == "yes";

        const result =
            isPublishedAgent ?
                await this.agentsService.getPublishedAgent(agentId) :
                await this.agentsService.getOne(agentId, userEmail);

        if (result) {
            return c.json({ result }, 200);
        }

        return c.json({ error: AgentsResponseMessages.notFoundAgent }, 404);
    }

    async getPublishedAgent(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const result = await this.agentsService.getPublishedAgent(agentId)

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

    async publishAgent(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const userEmail = c.get("userEmail");

        const { success, limitReached } = await this.agentsService.publishAgent(agentId, userEmail);

        if (success) {
            return c.json({ result: AgentsResponseMessages.successfulPublishAgent }, 200);
        } else {
            return c.json({
                error: limitReached ? AgentsResponseMessages.agentsLimitReached : AgentsResponseMessages.failedPublishAgent
            }, 400);
        }
    }

    async unpublishAgent(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const userEmail = c.get("userEmail");

        const result = await this.agentsService.updateAgentPublishingState(agentId, userEmail, true);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulUnpublishAgent }, 200);
        } else {
            return c.json({ error: AgentsResponseMessages.failedUnpublishAgent }, 400);
        }
    }

    async setDataset(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const datasetId = c.req.query("datasetId");
        const action = c.req.query("action");
        const userEmail = c.get("userEmail");

        if (!datasetId) {
            return c.json({ error: AgentsResponseMessages.noDatasetIdToAssociate }, 400);
        }

        if (action != "associate" && action != "unassociate") {
            return c.json({ error: "Unknown action" }, 400);
        }

        const result = await this.agentsService.setDataset({
            agentId,
            userEmail,
            datasetId,
            action
        });

        if (result) {
            return c.json({
                result: action == "associate" ?
                    AgentsResponseMessages.successfulAssociation : AgentsResponseMessages.successfulUnassociation
            }, 200);
        } else {
            return c.json({
                result: action == "associate" ?
                    AgentsResponseMessages.failedAssociation : AgentsResponseMessages.failedUnassociation
            }, 400);
        }
    }

    async delete(c: Context<{ Variables: { userEmail: string } }>) {
        const agentId = c.req.param("agentId");
        const userEmail = c.get("userEmail");
        const result = await this.agentsService.delete(agentId, userEmail);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentDeletion }, 200);
        }

        return c.json({ error: AgentsResponseMessages.failedAgentDeletion }, 400);
    }

    async update(c: Context<{ Variables: { userEmail: string } }, never, { out: { json: UpdateAgentFormData } }>) {
        const agentId = c.req.param("agentId") as string;
        const updateData = c.req.valid("json");
        const userEmail = c.get("userEmail");

        if (!Object.keys(updateData).length) {
            return c.json({ error: AgentsResponseMessages.noUpdateData }, 400);
        }

        const result = await this.agentsService.update(agentId, userEmail, updateData);

        if (result) {
            return c.json({ result: AgentsResponseMessages.successfulAgentUpdate }, 200);
        }

        return c.json({ error: AgentsResponseMessages.failedAgentUpdate }, 400);
    }
}

