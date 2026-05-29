import { StorageProvider, StorageObject, OracleConfig } from "./types";
export declare class OracleProvider implements StorageProvider {
    private config;
    private baseUrl;
    constructor(config: OracleConfig);
    private ociRequest;
    listObjects(prefix?: string): Promise<StorageObject[]>;
    getObject(key: string): Promise<NodeJS.ReadableStream>;
    putObject(key: string, stream: NodeJS.ReadableStream, _size?: number, contentType?: string): Promise<void>;
    headObject(key: string): Promise<{
        size: number;
        contentType?: string;
    } | null>;
}
//# sourceMappingURL=oracle.d.ts.map