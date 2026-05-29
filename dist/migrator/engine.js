"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const cli_progress_1 = __importDefault(require("cli-progress"));
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../utils/logger");
function formatBytes(bytes) {
    if (bytes === 0)
        return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
async function runWithConcurrency(tasks, concurrency) {
    const results = [];
    const executing = [];
    for (const task of tasks) {
        const p = task().then((r) => {
            results.push(r);
        });
        executing.push(p);
        if (executing.length >= concurrency) {
            await Promise.race(executing);
            executing.splice(executing.findIndex((e) => e === p), 1);
        }
    }
    await Promise.all(executing);
    return results;
}
async function migrate(source, destination, options) {
    const result = {
        total: 0,
        migrated: 0,
        skipped: 0,
        failed: 0,
        errors: [],
    };
    logger_1.logger.blank();
    logger_1.logger.info("Listando objetos na origem...");
    const objects = await source.listObjects(options.prefix);
    result.total = objects.length;
    if (result.total === 0) {
        logger_1.logger.warn("Nenhum objeto encontrado na origem.");
        return result;
    }
    const totalSize = objects.reduce((acc, o) => acc + o.size, 0);
    logger_1.logger.success(`${result.total} objetos encontrados (${formatBytes(totalSize)} total)`);
    logger_1.logger.blank();
    if (options.dryRun) {
        logger_1.logger.warn("Modo DRY RUN ativado. Nenhum dado será transferido.");
        objects.forEach((o) => logger_1.logger.dim(`  ${o.key} (${formatBytes(o.size)})`));
        return result;
    }
    // Barra de progresso principal
    const multiBar = new cli_progress_1.default.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: chalk_1.default.cyan("{bar}") +
            " | {percentage}% | {value}/{total} objetos | {filename}",
        barCompleteChar: "█",
        barIncompleteChar: "░",
        barsize: 30,
    }, cli_progress_1.default.Presets.shades_classic);
    const progressBar = multiBar.create(result.total, 0, { filename: "iniciando..." });
    const tasks = objects.map((obj) => async () => {
        try {
            // Verificar se já existe no destino
            if (options.skipExisting) {
                const existing = await destination.headObject(obj.key);
                if (existing && existing.size === obj.size) {
                    result.skipped++;
                    progressBar.increment(1, { filename: chalk_1.default.yellow(`[SKIP] ${obj.key}`) });
                    return;
                }
            }
            // Obter stream da origem
            const stream = await source.getObject(obj.key);
            // Enviar para destino
            await destination.putObject(obj.key, stream, obj.size);
            result.migrated++;
            progressBar.increment(1, {
                filename: chalk_1.default.green(`${obj.key} (${formatBytes(obj.size)})`),
            });
        }
        catch (err) {
            result.failed++;
            const errorMsg = err instanceof Error ? err.message : String(err);
            result.errors.push({ key: obj.key, error: errorMsg });
            progressBar.increment(1, { filename: chalk_1.default.red(`[ERRO] ${obj.key}`) });
        }
    });
    await runWithConcurrency(tasks, options.concurrency);
    multiBar.stop();
    return result;
}
//# sourceMappingURL=engine.js.map