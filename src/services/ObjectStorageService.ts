import { UTApi } from "uploadthing/server";

export class ObjectStorageService {
    constructor(private readonly utApi: UTApi) { }

    async deleteFiles(urls: string[] | string) {
        const keys = typeof urls == "string" ? this.extractKeyFromUrl(urls) : urls.map(this.extractKeyFromUrl)
        return await this.utApi.deleteFiles(keys)
    }

    private extractKeyFromUrl(url: string) {
        return url.split("/").at(-1) || ""
    }
}