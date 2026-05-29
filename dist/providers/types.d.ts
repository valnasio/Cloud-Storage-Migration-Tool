export type ProviderType = "s3" | "r2" | "gcs" | "azure" | "oracle" | "backblaze" | "wasabi" | "digitalocean" | "minio" | "linode";
export interface ProviderConfig {
    type: ProviderType;
    label: string;
    bucket: string;
    prefix?: string;
}
export interface S3CompatibleConfig extends ProviderConfig {
    type: "s3" | "r2" | "backblaze" | "wasabi" | "digitalocean" | "minio" | "linode";
    endpoint?: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}
export interface GCSConfig extends ProviderConfig {
    type: "gcs";
    projectId: string;
    keyFilePath?: string;
    keyFileJson?: string;
}
export interface AzureConfig extends ProviderConfig {
    type: "azure";
    accountName: string;
    accountKey?: string;
    sasToken?: string;
    connectionString?: string;
}
export interface OracleConfig extends ProviderConfig {
    type: "oracle";
    namespace: string;
    region: string;
    tenancyId: string;
    userId: string;
    fingerprint: string;
    privateKey: string;
}
export type AnyProviderConfig = S3CompatibleConfig | GCSConfig | AzureConfig | OracleConfig;
export interface StorageProvider {
    listObjects(prefix?: string): Promise<StorageObject[]>;
    getObject(key: string): Promise<NodeJS.ReadableStream>;
    putObject(key: string, stream: NodeJS.ReadableStream, size?: number, contentType?: string): Promise<void>;
    headObject(key: string): Promise<{
        size: number;
        contentType?: string;
    } | null>;
}
export interface StorageObject {
    key: string;
    size: number;
    lastModified?: Date;
}
//# sourceMappingURL=types.d.ts.map