import { UTApi } from "uploadthing/server";
import sentryClient from "../sentry.ts";

export class ObjectStorageService {
    constructor(private readonly utApi: UTApi) { }

    async deleteAvatars(urls: string[] | string) {
        const keys = typeof urls == "string" ? this.extractKeyFromUrl(urls) : urls.map(this.extractKeyFromUrl)
        const result = await this.utApi.deleteFiles(keys)
            .catch((error) => {
                sentryClient.captureException(error, {
                    extra: {
                        service: "ObjectStorageService",
                        method: "deleteFiles",
                        urls,
                    }
                });
            })

        return !!result?.success
    }

    private extractKeyFromUrl(url: string) {
        return url.split("/").at(-1) || ""
    }
}