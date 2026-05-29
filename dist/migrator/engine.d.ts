import { StorageProvider } from "../providers/types";
export interface MigrationOptions {
    skipExisting: boolean;
    dryRun: boolean;
    concurrency: number;
    prefix?: string;
}
export interface MigrationResult {
    total: number;
    migrated: number;
    skipped: number;
    failed: number;
    errors: {
        key: string;
        error: string;
    }[];
}
export declare function migrate(source: StorageProvider, destination: StorageProvider, options: MigrationOptions): Promise<MigrationResult>;
//# sourceMappingURL=engine.d.ts.map