import {
    BlobServiceClient,
    StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { StorageProvider, StorageObject, AzureConfig } from "./types";
import { Readable } from "stream";

export class AzureProvider implements StorageProvider {
    private client: BlobServiceClient;
    private container: string;
    private prefix: string;

    constructor(config: AzureConfig) {
        if (config.connectionString) {
            this.client = BlobServiceClient.fromConnectionString(
                config.connectionString
            );
        } else if (config.accountKey) {
            const credential = new StorageSharedKeyCredential(
                config.accountName,
                config.accountKey
            );
            this.client = new BlobServiceClient(
                `https://${config.accountName}.blob.core.windows.net`,
                credential
            );
        } else if (config.sasToken) {
            this.client = new BlobServiceClient(
                `https://${config.accountName}.blob.core.windows.net?${config.sasToken}`
            );
        } else {
            throw new Error("Azure: forneça connectionString, accountKey ou sasToken");
        }

        this.container = config.bucket;
        this.prefix = config.prefix || "";
    }

    async listObjects(prefix?: string): Promise<StorageObject[]> {
        const containerClient = this.client.getContainerClient(this.container);
        const objects: StorageObject[] = [];

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

    async getObject(key: string): Promise<NodeJS.ReadableStream> {
        const containerClient = this.client.getContainerClient(this.container);
        const blobClient = containerClient.getBlobClient(key);
        const response = await blobClient.download();
        return response.readableStreamBody as NodeJS.ReadableStream;
    }

    async putObject(
        key: string,
        stream: NodeJS.ReadableStream,
        size?: number,
        contentType?: string
    ): Promise<void> {
        const containerClient = this.client.getContainerClient(this.container);
        const blockBlobClient = containerClient.getBlockBlobClient(key);

        await blockBlobClient.uploadStream(stream as Readable, undefined, undefined, {
            blobHTTPHeaders: { blobContentType: contentType || "application/octet-stream" },
        });
    }

    async headObject(
        key: string
    ): Promise<{ size: number; contentType?: string } | null> {
        try {
            const containerClient = this.client.getContainerClient(this.container);
            const blobClient = containerClient.getBlobClient(key);
            const props = await blobClient.getProperties();
            return {
                size: props.contentLength || 0,
                contentType: props.contentType,
            };
        } catch {
            return null;
        }
    }
}