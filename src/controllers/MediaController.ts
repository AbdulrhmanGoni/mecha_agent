import { Context } from "npm:hono";
import { ObjectStorageService } from "../services/ObjectStorageService.ts";

export class MediaController {
    constructor(private objectStorageService: ObjectStorageService) { }

    async getMedia(c: Context) {
        const scope = c.req.param("scope");
        const mediaName = c.req.param("mediaName");
        const imageStream = await this.objectStorageService.getFile(scope, mediaName);
        const contentType = imageStream.headers?.["content-type"] || "text/plain";
        const contentLength = imageStream.headers?.["content-length"] || "";

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

