import * as vscode from "vscode";
import { MarkEntity, MarkType } from "../domain/models";

export class QuickBunnyTreeProvider
    implements vscode.TreeDataProvider<MarkEntity>
{
    // CORREÇÃO: Removemos 'void' do tipo genérico para compatibilidade estrita
    private _onDidChangeTreeData = new vscode.EventEmitter<
        MarkEntity | undefined | null
    >();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private currentMarks: MarkEntity[] = [];

    constructor() {}

    public refresh(marks: MarkEntity[]) {
        this.currentMarks = marks;
        // Passar undefined/null sinaliza para atualizar a árvore inteira
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MarkEntity): vscode.TreeItem {
        const item = new vscode.TreeItem(
            element.label,
            vscode.TreeItemCollapsibleState.None
        );

        item.description = element.description;
        item.tooltip = `${element.type.toUpperCase()}: ${element.label}`;

        item.command = {
            command: "quickBunny.reveal",
            title: "Reveal Mark",
            arguments: [element],
        };

        // O erro "Constructor is private" sumirá após o npm install do novo package.json
        item.iconPath = this.getIconForType(element.type);

        return item;
    }

    getChildren(element?: MarkEntity): vscode.ProviderResult<MarkEntity[]> {
        if (element) {
            return [];
        }
        return this.currentMarks;
    }

    private getIconForType(type: MarkType): vscode.ThemeIcon {
        switch (type) {
            case "section":
                return new vscode.ThemeIcon("list-unordered");
            case "todo":
                return new vscode.ThemeIcon("pencil");
            case "note":
                return new vscode.ThemeIcon("book");
            default:
                return new vscode.ThemeIcon("circle-filled");
        }
    }
}
