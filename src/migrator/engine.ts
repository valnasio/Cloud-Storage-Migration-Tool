import cliProgress from "cli-progress";
import chalk from "chalk";
import { StorageProvider, StorageObject } from "../providers/types";
import { logger } from "../utils/logger";

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
    errors: { key: string; error: string }[];
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function runWithConcurrency<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number
): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
        const p = task().then((r) => {
            results.push(r);
        });

        executing.push(p);

        if (executing.length >= concurrency) {
            await Promise.race(executing);
            executing.splice(
                executing.findIndex((e) => e === p),
                1
            );
        }
    }

    await Promise.all(executing);
    return results;
}

export async function migrate(
    source: StorageProvider,
    destination: StorageProvider,
    options: MigrationOptions
): Promise<MigrationResult> {
    const result: MigrationResult = {
        total: 0,
        migrated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
    };

    logger.blank();
    logger.info("Listando objetos na origem...");

    const objects = await source.listObjects(options.prefix);
    result.total = objects.length;

    if (result.total === 0) {
        logger.warn("Nenhum objeto encontrado na origem.");
        return result;
    }

    const totalSize = objects.reduce((acc, o) => acc + o.size, 0);

    logger.success(`${result.total} objetos encontrados (${formatBytes(totalSize)} total)`);
    logger.blank();

    if (options.dryRun) {
        logger.warn("Modo DRY RUN ativado. Nenhum dado será transferido.");
        objects.forEach((o) =>
            logger.dim(`  ${o.key} (${formatBytes(o.size)})`)
        );
        return result;
    }

    // Barra de progresso principal
    const multiBar = new cliProgress.MultiBar(
        {
            clearOnComplete: false,
            hideCursor: true,
            format:
                chalk.cyan("{bar}") +
                " | {percentage}% | {value}/{total} objetos | {filename}",
            barCompleteChar: "█",
            barIncompleteChar: "░",
            barsize: 30,
        },
        cliProgress.Presets.shades_classic
    );

    const progressBar = multiBar.create(result.total, 0, { filename: "iniciando..." });

    const tasks = objects.map((obj: StorageObject) => async () => {
        try {
            // Verificar se já existe no destino
            if (options.skipExisting) {
                const existing = await destination.headObject(obj.key);
                if (existing && existing.size === obj.size) {
                    result.skipped++;
                    progressBar.increment(1, { filename: chalk.yellow(`[SKIP] ${obj.key}`) });
                    return;
                }
            }

            // Obter stream da origem
            const stream = await source.getObject(obj.key);

            // Enviar para destino
            await destination.putObject(obj.key, stream, obj.size);

            result.migrated++;
            progressBar.increment(1, {
                filename: chalk.green(
                    `${obj.key} (${formatBytes(obj.size)})`
                ),
            });
        } catch (err) {
            result.failed++;
            const errorMsg = err instanceof Error ? err.message : String(err);
            result.errors.push({ key: obj.key, error: errorMsg });
            progressBar.increment(1, { filename: chalk.red(`[ERRO] ${obj.key}`) });
        }
    });

    await runWithConcurrency(tasks, options.concurrency);

    multiBar.stop();

    return result;
}