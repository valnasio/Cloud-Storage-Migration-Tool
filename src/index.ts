import chalk from "chalk";
import { showBanner, showResult } from "./cli/display";
import { mainMenu } from "./cli/menu";
import { promptProvider, promptMigrationOptions } from "./cli/prompts";
import { AnyProviderConfig, S3CompatibleConfig, GCSConfig, AzureConfig, OracleConfig } from "./providers/types";
import { S3CompatibleProvider } from "./providers/s3-compatible";
import { GCSProvider } from "./providers/gcs";
import { AzureProvider } from "./providers/azure";
import { OracleProvider } from "./providers/oracle";
import { migrate } from "./migrator/engine";
import { logger } from "./utils/logger";
import type { StorageProvider } from "./providers/types";

function buildProvider(config: AnyProviderConfig): StorageProvider {
    switch (config.type) {
        case "gcs":
            return new GCSProvider(config as GCSConfig);
        case "azure":
            return new AzureProvider(config as AzureConfig);
        case "oracle":
            return new OracleProvider(config as OracleConfig);
        default:
            return new S3CompatibleProvider(config as S3CompatibleConfig);
    }
}

async function main() {
    showBanner();

    const action = await mainMenu();

    if (action === "exit") {
        console.log(chalk.dim("\n  Até mais!\n"));
        process.exit(0);
    }

    // --- Seleção de origem e destino ---
    console.log(chalk.bold.white("\n  Configure a ORIGEM:\n"));
    const sourceConfig = await promptProvider("Origem");

    console.log(chalk.bold.white("\n  Configure o DESTINO:\n"));
    const destConfig = await promptProvider("Destino");

    // --- Opções de migração ---
    console.log(chalk.bold.white("\n  Opções de migração:\n"));
    const options = await promptMigrationOptions();

    if (!options.confirm) {
        logger.warn("Migração cancelada pelo usuário.");
        process.exit(0);
    }

    // --- Build dos providers ---
    const sourceProvider = buildProvider(sourceConfig);
    const destProvider = buildProvider(destConfig);

    // --- Executar migração ---
    console.log(chalk.bold.cyan("\n  Iniciando migração...\n"));

    try {
        const result = await migrate(sourceProvider, destProvider, {
            skipExisting: options.skipExisting,
            dryRun: options.dryRun,
            concurrency: options.concurrency,
            prefix: sourceConfig.prefix,
        });

        showResult(result);
    } catch (err) {
        logger.error("Erro fatal durante a migração:");
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}

main();