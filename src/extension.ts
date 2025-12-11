import * as vscode from "vscode";
import { DecorationManager } from "./adapters/DecorationManager";
import { MarkController } from "./adapters/MarkController";
import { StatusBarManager } from "./adapters/StatusBarManager";
import { QuickBunnyTreeProvider } from "./adapters/TreeProvider";
import { MarkScanner } from "./core/MarkScanner";

export function activate(context: vscode.ExtensionContext) {
    const scanner = new MarkScanner();
    const statusBar = new StatusBarManager();
    const treeProvider = new QuickBunnyTreeProvider();

    const decorationManager = new DecorationManager(context);

    const controller = new MarkController(
        scanner,
        treeProvider,
        statusBar,
        decorationManager
    );

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider("quickBunnyView", treeProvider),
        controller,
        statusBar,
        decorationManager
    );
}
