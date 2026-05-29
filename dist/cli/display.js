"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showBanner = showBanner;
exports.showResult = showResult;
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
function showBanner() {
    console.clear();
    const banner = figlet_1.default.textSync("CloudMigrator", {
        font: "Slant",
        horizontalLayout: "default",
    });
    console.log(chalk_1.default.cyan(banner));
    console.log(chalk_1.default.dim("  Multi-cloud Object Storage Migrator | v1.0.0\n"));
    console.log(chalk_1.default.dim("─".repeat(60)));
    console.log();
}
function showResult(result) {
    console.log();
    console.log(chalk_1.default.dim("─".repeat(60)));
    console.log(chalk_1.default.bold.white("\n  Resultado da Migração\n"));
    console.log(chalk_1.default.white("  Total de objetos:  ") +
        chalk_1.default.bold.white(result.total));
    console.log(chalk_1.default.white("  Migrados:          ") +
        chalk_1.default.bold.green(result.migrated));
    console.log(chalk_1.default.white("  Ignorados:         ") +
        chalk_1.default.bold.yellow(result.skipped));
    console.log(chalk_1.default.white("  Falhas:            ") +
        chalk_1.default.bold.red(result.failed));
    if (result.errors.length > 0) {
        console.log(chalk_1.default.dim("\n  Erros detalhados:\n"));
        result.errors.forEach((e) => {
            console.log(chalk_1.default.red(`  ✖  ${e.key}`));
            console.log(chalk_1.default.dim(`     ${e.error}\n`));
        });
    }
    console.log(chalk_1.default.dim("\n" + "─".repeat(60)));
    if (result.failed === 0) {
        console.log(chalk_1.default.bold.green("\n  ✔  Migração concluída com sucesso!\n"));
    }
    else {
        console.log(chalk_1.default.bold.yellow(`\n  ⚠  Migração concluída com ${result.failed} erro(s).\n`));
    }
}
//# sourceMappingURL=display.js.map