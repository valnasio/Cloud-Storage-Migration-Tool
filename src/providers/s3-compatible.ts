import {
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import { StorageProvider, StorageObject, S3CompatibleConfig } from "./types";

const ENDPOINTS: Record<string, string> = {
    r2: "", // definido pelo usuário (account-id.r2.cloudflarestorage.com)
    backblaze: "https://s3.us-west-004.backblazeb2.com",
    wasabi: "https://s3.wasabisys.com",
    digitalocean: "https://{region}.digitaloceanspaces.com",
    minio: "", // definido pelo usuário
    linode: "https://{region}.linodeobjects.com",
    s3: "", // AWS padrão
};

export class S3CompatibleProvider implements StorageProvider {
    private client: S3Client;
    private bucket: string;
    private prefix: string;

    constructor(config: S3CompatibleConfig) {
        let endpoint = config.endpoint;

        if (!endpoint && ENDPOINTS[config.type]) {
            endpoint = ENDPOINTS[config.type].replace("{region}", config.region);
        }

        this.client = new S3Client({
            region: config.region || "auto",
            endpoint: endpoint || undefined,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            forcePathStyle: ["minio", "r2"].includes(config.type),
        });

        this.bucket = config.bucket;
        this.prefix = config.prefix || "";
    }

    async listObjects(prefix?: string): Promise<StorageObject[]> {
        const objects: StorageObject[] = [];
        let continuationToken: string | undefined;
        const effectivePrefix = prefix ?? this.prefix;

        do {
            const response = await this.client.send(
                new ListObjectsV2Command({
                    Bucket: this.bucket,
                    Prefix: effectivePrefix || undefined,
                    ContinuationToken: continuationToken,
                })
            );

            for (const obj of response.Contents || []) {
                if (obj.Key) {
                    objects.push({
                        key: obj.Key,
                        size: obj.Size || 0,
                        lastModified: obj.LastModified,
                    });
                }
            }

            continuationToken = response.IsTruncated
                ? response.NextContinuationToken
                : undefined;
        } while (continuationToken);

        return objects;
    }

    async getObject(key: string): Promise<NodeJS.ReadableStream> {
        const response = await this.client.send(
            new GetObjectCommand({ Bucket: this.bucket, Key: key })
        );
        return response.Body as Readable;
    }

    async putObject(
        key: string,
        stream: NodeJS.ReadableStream,
        size?: number,
        contentType?: string
    ): Promise<void> {
        const upload = new Upload({
            client: this.client,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: stream as Readable,
                ContentType: contentType || "application/octet-stream",
                ContentLength: size,
            },
            queueSize: 4,
            partSize: 1024 * 1024 * 16, // 16MB parts
        });

        await upload.done();
    }

    async headObject(
        key: string
    ): Promise<{ size: number; contentType?: string } | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({ Bucket: this.bucket, Key: key })
            );
            return {
                size: response.ContentLength || 0,
                contentType: response.ContentType,
            };
        } catch {
            return null;
        }
    }
}