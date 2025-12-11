import * as vscode from "vscode";
import { MarkEntity } from "../domain/models";

export class QuickBunnyTreeProvider
    implements vscode.TreeDataProvider<MarkEntity>
{
    private _onDidChangeTreeData = new vscode.EventEmitter<
        MarkEntity | undefined | null
    >();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    private currentMarks: MarkEntity[] = [];

    constructor() {}

    public refresh(marks: MarkEntity[]) {
        this.currentMarks = marks;
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MarkEntity): vscode.TreeItem {
        const hasChildren = element.children && element.children.length > 0;

        // Define o estado inicial (MARKs vêm expandidos por padrão para facilitar a visão)
        const collapsibleState = hasChildren
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None;

        const item = new vscode.TreeItem(element.label, collapsibleState);

        // Descrição mais limpa
        item.description = element.description;
        item.tooltip = `${element.type}: ${element.label}`;

        item.command = {
            command: "quickBunny.reveal",
            title: "Reveal",
            arguments: [element],
        };

        item.iconPath = this.getIconForType(element.type);
        return item;
    }

    getChildren(element?: MarkEntity): vscode.ProviderResult<MarkEntity[]> {
        if (!element) return this.currentMarks;
        return element.children || [];
    }

    private getIconForType(type: string): vscode.ThemeIcon {
        const t = type.toUpperCase();

        // Ícones Nativos do VS Code (Product Icons)
        // Referência: https://code.visualstudio.com/api/references/icons-in-labels
        if (t === "METHOD") return new vscode.ThemeIcon("symbol-method");
        if (["TODO", "FIXME"].includes(t))
            return new vscode.ThemeIcon("checklist");
        if (["BUG"].includes(t)) return new vscode.ThemeIcon("bug");
        if (["HACK", "ZAP"].includes(t)) return new vscode.ThemeIcon("zap");
        if (["NOTE", "INFO"].includes(t)) return new vscode.ThemeIcon("info");

        // Ícones Estruturais para MARK/SECTION
        if (["SECTION"].includes(t))
            return new vscode.ThemeIcon("symbol-structure");
        if (["MARK"].includes(t)) return new vscode.ThemeIcon("bookmark");

        return new vscode.ThemeIcon("tag");
    }
}
