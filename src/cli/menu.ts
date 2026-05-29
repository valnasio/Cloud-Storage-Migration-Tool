import inquirer from "inquirer";

export async function mainMenu(): Promise<"migrate" | "exit"> {
    const { action } = await inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: "O que deseja fazer?",
            choices: [
                { name: "Migrar dados entre clouds", value: "migrate" },
                { name: "Sair", value: "exit" },
            ],
        },
    ]);
    return action;
}