"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainMenu = mainMenu;
const inquirer_1 = __importDefault(require("inquirer"));
async function mainMenu() {
    const { action } = await inquirer_1.default.prompt([
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
//# sourceMappingURL=menu.js.map