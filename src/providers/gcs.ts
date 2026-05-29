import { Storage } from "@google-cloud/storage";
import { StorageProvider, StorageObject, GCSConfig } from "./types";
import { Readable } from "stream";

export class GCSProvider implements StorageProvider {
    private storage: Storage;
    private bucket: string;
    private prefix: string;

    constructor(config: GCSConfig) {
        const storageOptions: Record<string, unknown> = {
            projectId: config.projectId,
        };

        if (config.keyFilePath) {
            storageOptions.keyFilename = config.keyFilePath;
        } else if (config.keyFileJson) {
            storageOptions.credentials = JSON.parse(config.keyFileJson);
        }

        this.storage = new Storage(storageOptions);
        this.bucket = config.bucket;
        this.prefix = config.prefix || "";
    }

    async listObjects(prefix?: string): Promise<StorageObject[]> {
        const [files] = await this.storage.bucket(this.bucket).getFiles({
            prefix: (prefix ?? this.prefix) || undefined,
        });

        return files.map((f) => ({
            key: f.name,
            size: parseInt(f.metadata.size as string) || 0,
            lastModified: f.metadata.updated
                ? new Date(f.metadata.updated as string)
                : undefined,
        }));
    }

    async getObject(key: string): Promise<NodeJS.ReadableStream> {
        return this.storage.bucket(this.bucket).file(key).createReadStream();
    }

    async putObject(
        key: string,
        stream: NodeJS.ReadableStream,
        _size?: number,
        contentType?: string
    ): Promise<void> {
        const file = this.storage.bucket(this.bucket).file(key);
        const writeStream = file.createWriteStream({
            contentType: contentType || "application/octet-stream",
            resumable: true,
        });

        await new Promise<void>((resolve, reject) => {
            (stream as Readable).pipe(writeStream).on("finish", resolve).on("error", reject);
        });
    }

    async headObject(
        key: string
    ): Promise<{ size: number; contentType?: string } | null> {
        try {
            const [metadata] = await this.storage
                .bucket(this.bucket)
                .file(key)
                .getMetadata();
            return {
                size: parseInt(metadata.size as string) || 0,
                contentType: metadata.contentType as string | undefined,
            };
        } catch {
            return null;
        }
    }
}