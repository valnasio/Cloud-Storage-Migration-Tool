import { StorageProvider, StorageObject, S3CompatibleConfig } from "./types";
export declare class S3CompatibleProvider implements StorageProvider {
    private client;
    private bucket;
    private prefix;
    constructor(config: S3CompatibleConfig);
    listObjects(prefix?: string): Promise<StorageObject[]>;
    getObject(key: string): Promise<NodeJS.ReadableStream>;
    putObject(key: string, stream: NodeJS.ReadableStream, size?: number, contentType?: string): Promise<void>;
    headObject(key: string): Promise<{
        size: number;
        contentType?: string;
    } | null>;
}
//# sourceMappingURL=s3-compatible.d.ts.map