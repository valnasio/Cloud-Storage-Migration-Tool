"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureProvider = void 0;
const storage_blob_1 = require("@azure/storage-blob");
class AzureProvider {
    constructor(config) {
        if (config.connectionString) {
            this.client = storage_blob_1.BlobServiceClient.fromConnectionString(config.connectionString);
        }
        else if (config.accountKey) {
            const credential = new storage_blob_1.StorageSharedKeyCredential(config.accountName, config.accountKey);
            this.client = new storage_blob_1.BlobServiceClient(`https://${config.accountName}.blob.core.windows.net`, credential);
        }
        else if (config.sasToken) {
            this.client = new storage_blob_1.BlobServiceClient(`https://${config.accountName}.blob.core.windows.net?${config.sasToken}`);
        }
        else {
            throw new Error("Azure: forneça connectionString, accountKey ou sasToken");
        }
        this.container = config.bucket;
        this.prefix = config.prefix || "";
    }
    async listObjects(prefix) {
        const containerClient = this.client.getContainerClient(this.container);
        const objects = [];
        for await (const blob of containerClient.listBlobsFlat({
            prefix: (prefix ?? this.prefix) || undefined,
        })) {
            objects.push({
                key: blob.name,
                size: blob.properties.contentLength || 0,
                lastModified: blob.properties.lastModified,
            });
        }
        return objects;
    }
    async getObject(key) {
        const containerClient = this.client.getContainerClient(this.container);
        const blobClient = containerClient.getBlobClient(key);
        const response = await blobClient.download();
        return response.readableStreamBody;
    }
    async putObject(key, stream, size, contentType) {
        const containerClient = this.client.getContainerClient(this.container);
        const blockBlobClient = containerClient.getBlockBlobClient(key);
        await blockBlobClient.uploadStream(stream, undefined, undefined, {
            blobHTTPHeaders: { blobContentType: contentType || "application/octet-stream" },
        });
    }
    async headObject(key) {
        try {
            const containerClient = this.client.getContainerClient(this.container);
            const blobClient = containerClient.getBlobClient(key);
            const props = await blobClient.getProperties();
            return {
                size: props.contentLength || 0,
                contentType: props.contentType,
            };
        }
        catch {
            return null;
        }
    }
}
exports.AzureProvider = AzureProvider;
//# sourceMappingURL=azure.js.map