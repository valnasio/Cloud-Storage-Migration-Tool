"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3CompatibleProvider = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const ENDPOINTS = {
    r2: "", // definido pelo usuário (account-id.r2.cloudflarestorage.com)
    backblaze: "https://s3.us-west-004.backblazeb2.com",
    wasabi: "https://s3.wasabisys.com",
    digitalocean: "https://{region}.digitaloceanspaces.com",
    minio: "", // definido pelo usuário
    linode: "https://{region}.linodeobjects.com",
    s3: "", // AWS padrão
};
class S3CompatibleProvider {
    constructor(config) {
        let endpoint = config.endpoint;
        if (!endpoint && ENDPOINTS[config.type]) {
            endpoint = ENDPOINTS[config.type].replace("{region}", config.region);
        }
        this.client = new client_s3_1.S3Client({
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
    async listObjects(prefix) {
        const objects = [];
        let continuationToken;
        const effectivePrefix = prefix ?? this.prefix;
        do {
            const response = await this.client.send(new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: effectivePrefix || undefined,
                ContinuationToken: continuationToken,
            }));
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
    async getObject(key) {
        const response = await this.client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }));
        return response.Body;
    }
    async putObject(key, stream, size, contentType) {
        const upload = new lib_storage_1.Upload({
            client: this.client,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: stream,
                ContentType: contentType || "application/octet-stream",
                ContentLength: size,
            },
            queueSize: 4,
            partSize: 1024 * 1024 * 16, // 16MB parts
        });
        await upload.done();
    }
    async headObject(key) {
        try {
            const response = await this.client.send(new client_s3_1.HeadObjectCommand({ Bucket: this.bucket, Key: key }));
            return {
                size: response.ContentLength || 0,
                contentType: response.ContentType,
            };
        }
        catch {
            return null;
        }
    }
}
exports.S3CompatibleProvider = S3CompatibleProvider;
//# sourceMappingURL=s3-compatible.js.map