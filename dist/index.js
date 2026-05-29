"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const display_1 = require("./cli/display");
const menu_1 = require("./cli/menu");
const prompts_1 = require("./cli/prompts");
const s3_compatible_1 = require("./providers/s3-compatible");
const gcs_1 = require("./providers/gcs");
const azure_1 = require("./providers/azure");
const oracle_1 = require("./providers/oracle");
const engine_1 = require("./migrator/engine");
const logger_1 = require("./utils/logger");
function buildProvider(config) {
    switch (config.type) {
        case "gcs":
            return new gcs_1.GCSProvider(config);
        case "azure":
            return new azure_1.AzureProvider(config);
        case "oracle":
            return new oracle_1.OracleProvider(config);
        default:
            return new s3_compatible_1.S3CompatibleProvider(config);
    }
}
async function main() {
    (0, display_1.showBanner)();
    const action = await (0, menu_1.mainMenu)();
    if (action === "exit") {
        console.log(chalk_1.default.dim("\n  Até mais!\n"));
        process.exit(0);
    }
    // --- Seleção de origem e destino ---
    console.log(chalk_1.default.bold.white("\n  Configure a ORIGEM:\n"));
    const sourceConfig = await (0, prompts_1.promptProvider)("Origem");
    console.log(chalk_1.default.bold.white("\n  Configure o DESTINO:\n"));
    const destConfig = await (0, prompts_1.promptProvider)("Destino");
    // --- Opções de migração ---
    console.log(chalk_1.default.bold.white("\n  Opções de migração:\n"));
    const options = await (0, prompts_1.promptMigrationOptions)();
    if (!options.confirm) {
        logger_1.logger.warn("Migração cancelada pelo usuário.");
        process.exit(0);
    }
    // --- Build dos providers ---
    const sourceProvider = buildProvider(sourceConfig);
    const destProvider = buildProvider(destConfig);
    // --- Executar migração ---
    console.log(chalk_1.default.bold.cyan("\n  Iniciando migração...\n"));
    try {
        const result = await (0, engine_1.migrate)(sourceProvider, destProvider, {
            skipExisting: options.skipExisting,
            dryRun: options.dryRun,
            concurrency: options.concurrency,
            prefix: sourceConfig.prefix,
        });
        (0, display_1.showResult)(result);
    }
    catch (err) {
        logger_1.logger.error("Erro fatal durante a migração:");
        logger_1.logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map