import { StorageProvider, StorageObject, GCSConfig } from "./types";
export declare class GCSProvider implements StorageProvider {
    private storage;
    private bucket;
    private prefix;
    constructor(config: GCSConfig);
    listObjects(prefix?: string): Promise<StorageObject[]>;
    getObject(key: string): Promise<NodeJS.ReadableStream>;
    putObject(key: string, stream: NodeJS.ReadableStream, _size?: number, contentType?: string): Promise<void>;
    headObject(key: string): Promise<{
        size: number;
        contentType?: string;
    } | null>;
}
//# sourceMappingURL=gcs.d.ts.map