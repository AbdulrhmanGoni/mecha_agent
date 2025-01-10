import { mimeTypeToFileExtentionMap } from "../constant/supportedFileTypes.ts";
import { DatabaseService } from "./DatabaseService.ts";
import { ObjectStorageService } from "./ObjectStorageService.ts";

const agentRowFieldsNamesMap: Record<string, string> = {
    agentName: "agent_name",
    systemInstructions: "system_instructions",
    datasetId: "dataset_id",
    dontKnowResponse: "dont_know_response",
    responseSyntax: "response_syntax",
    greetingMessage: "greeting_message",
}

export class AgentsService {
    constructor(
        private databaseService: DatabaseService,
        private objectStorageService: ObjectStorageService,
    ) { }

    async create(newAgent: CreateAgentFormData) {
        const { avatar, ...agentData } = newAgent

        let avatarId = null;

        if (avatar) {
            const fileExtention = mimeTypeToFileExtentionMap[avatar.type];
            avatarId = `${crypto.randomUUID()}.${fileExtention}`;
        }

        type CreationDataFormat = [string, string, string[]];

        const [fields, placeholders, values] = Object
            .entries({ ...agentData, avatar: avatarId })
            .reduce<CreationDataFormat>(([fields, placeholders, values], [field, value], i, arr) => {
                return [
                    (
                        fields +
                        `${agentRowFieldsNamesMap[field] || field}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    (
                        `${placeholders}$${i + 1}` +
                        `${i === arr.length - 1 ? "" : ", "}`
                    ),
                    [...values, value || ""]
                ]
            }, ["", "", []])

        const transaction = this.databaseService.createTransaction("creating_agent")
        await transaction.begin();

        const result = await transaction.queryObject(`
            INSERT INTO agents (${fields})
            VALUES (${placeholders});
        `, values)

        if (result.rowCount) {
            if (newAgent.avatar && avatarId) {
                try {
                    await this.objectStorageService.uploadFile(
                        this.objectStorageService.buckets.agentsAvatars,
                        newAgent.avatar,
                        { id: avatarId }
                    );
                } catch {
                    await transaction.rollback();
                    return false;
                }
            }

            await transaction.commit();
            return true;
        }

        await transaction.rollback();
        return false;
    }
}
