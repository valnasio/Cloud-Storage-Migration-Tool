"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCSProvider = void 0;
const storage_1 = require("@google-cloud/storage");
class GCSProvider {
    constructor(config) {
        const storageOptions = {
            projectId: config.projectId,
        };
        if (config.keyFilePath) {
            storageOptions.keyFilename = config.keyFilePath;
        }
        else if (config.keyFileJson) {
            storageOptions.credentials = JSON.parse(config.keyFileJson);
        }
        this.storage = new storage_1.Storage(storageOptions);
        this.bucket = config.bucket;
        this.prefix = config.prefix || "";
    }
    async listObjects(prefix) {
        const [files] = await this.storage.bucket(this.bucket).getFiles({
            prefix: (prefix ?? this.prefix) || undefined,
        });
        return files.map((f) => ({
            key: f.name,
            size: parseInt(f.metadata.size) || 0,
            lastModified: f.metadata.updated
                ? new Date(f.metadata.updated)
                : undefined,
        }));
    }
    async getObject(key) {
        return this.storage.bucket(this.bucket).file(key).createReadStream();
    }
    async putObject(key, stream, _size, contentType) {
        const file = this.storage.bucket(this.bucket).file(key);
        const writeStream = file.createWriteStream({
            contentType: contentType || "application/octet-stream",
            resumable: true,
        });
        await new Promise((resolve, reject) => {
            stream.pipe(writeStream).on("finish", resolve).on("error", reject);
        });
    }
    async headObject(key) {
        try {
            const [metadata] = await this.storage
                .bucket(this.bucket)
                .file(key)
                .getMetadata();
            return {
                size: parseInt(metadata.size) || 0,
                contentType: metadata.contentType,
            };
        }
        catch {
            return null;
        }
    }
}
exports.GCSProvider = GCSProvider;
//# sourceMappingURL=gcs.js.map