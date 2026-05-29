import { StorageProvider, StorageObject, AzureConfig } from "./types";
export declare class AzureProvider implements StorageProvider {
    private client;
    private container;
    private prefix;
    constructor(config: AzureConfig);
    listObjects(prefix?: string): Promise<StorageObject[]>;
    getObject(key: string): Promise<NodeJS.ReadableStream>;
    putObject(key: string, stream: NodeJS.ReadableStream, size?: number, contentType?: string): Promise<void>;
    headObject(key: string): Promise<{
        size: number;
        contentType?: string;
    } | null>;
}
//# sourceMappingURL=azure.d.ts.map