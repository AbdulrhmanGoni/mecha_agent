import { Context } from "hono";
import { ObjectStorageService } from "../services/ObjectStorageService.ts";

export class MediaController {
    constructor(private objectStorageService: ObjectStorageService) { }

    async getMedia(c: Context<{ Variables: { userEmail: string } }>) {
        const userEmail = c.get("userEmail");
        const scope = c.req.param("scope");
        const mediaName = c.req.param("mediaName");
        const imageStream = await this.objectStorageService.getFile(scope, mediaName);
        const contentType = imageStream.headers?.["content-type"] || "text/plain";
        const contentLength = imageStream.headers?.["content-length"] || "";
        const userEmailHeader = imageStream.headers?.["x-amz-meta-user-email"];

        if (userEmail !== userEmailHeader) {
            return c.json({ error: "You are not allowed to access this media" }, 401)
        }

        const streamResponse = new ReadableStream({
            start(controller) {
                imageStream.on("data", (data) => {
                    controller.enqueue(data);
                })
                imageStream.on("end", () => {
                    controller.close();
                })
            }
        })

        return c.body(streamResponse, 200, {
            "Content-Type": contentType,
            "Content-Length": contentLength,
        });
    }
}

