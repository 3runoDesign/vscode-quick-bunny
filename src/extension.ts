import * as vscode from "vscode";

import { MarkController } from "./adapters/MarkController";
import { StatusBarManager } from "./adapters/StatusBarManager";
import { QuickBunnyTreeProvider } from "./adapters/TreeProvider";
import { MarkScanner } from "./core/MarkScanner";

export function activate(context: vscode.ExtensionContext) {
    console.log("QuickBunny is hopping!");

    // Injeção de Dependências Manual
    const scanner = new MarkScanner();
    const statusBar = new StatusBarManager();
    const treeProvider = new QuickBunnyTreeProvider();

    const controller = new MarkController(scanner, treeProvider, statusBar);

    // Registra UI
    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("quickBunnyView", treeProvider),
        controller,
        statusBar
    );
}

export function deactivate() {}
