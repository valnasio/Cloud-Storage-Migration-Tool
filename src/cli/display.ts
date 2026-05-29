import chalk from "chalk";
import figlet from "figlet";
import { MigrationResult } from "../migrator/engine";

export function showBanner(): void {
    console.clear();
    const banner = figlet.textSync("CloudMigrator", {
        font: "Slant",
        horizontalLayout: "default",
    });

    console.log(chalk.cyan(banner));
    console.log(
        chalk.dim("  Multi-cloud Object Storage Migrator | v1.0.0\n")
    );
    console.log(chalk.dim("─".repeat(60)));
    console.log();
}

export function showResult(result: MigrationResult): void {
    console.log();
    console.log(chalk.dim("─".repeat(60)));
    console.log(chalk.bold.white("\n  Resultado da Migração\n"));

    console.log(
        chalk.white("  Total de objetos:  ") +
        chalk.bold.white(result.total)
    );
    console.log(
        chalk.white("  Migrados:          ") +
        chalk.bold.green(result.migrated)
    );
    console.log(
        chalk.white("  Ignorados:         ") +
        chalk.bold.yellow(result.skipped)
    );
    console.log(
        chalk.white("  Falhas:            ") +
        chalk.bold.red(result.failed)
    );

    if (result.errors.length > 0) {
        console.log(chalk.dim("\n  Erros detalhados:\n"));
        result.errors.forEach((e) => {
            console.log(chalk.red(`  ✖  ${e.key}`));
            console.log(chalk.dim(`     ${e.error}\n`));
        });
    }

    console.log(chalk.dim("\n" + "─".repeat(60)));

    if (result.failed === 0) {
        console.log(chalk.bold.green("\n  ✔  Migração concluída com sucesso!\n"));
    } else {
        console.log(
            chalk.bold.yellow(
                `\n  ⚠  Migração concluída com ${result.failed} erro(s).\n`
            )
        );
    }
}