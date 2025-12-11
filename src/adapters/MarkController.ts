import * as vscode from "vscode";
import { MarkScanner } from "../core/MarkScanner";
import { MarkEntity } from "../domain/models";
import { DecorationManager } from "./DecorationManager";
import { StatusBarManager } from "./StatusBarManager";
import { QuickBunnyTreeProvider } from "./TreeProvider";

function flattenMarks(marks: MarkEntity[]): MarkEntity[] {
    let result: MarkEntity[] = [];
    marks.forEach((mark) => {
        result.push(mark);
        if (mark.children && mark.children.length > 0) {
            result = result.concat(flattenMarks(mark.children));
        }
    });
    return result;
}

export class MarkController implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private updateTimeout: NodeJS.Timeout | undefined;

    constructor(
        private scanner: MarkScanner,
        private treeProvider: QuickBunnyTreeProvider,
        private statusBar: StatusBarManager,
        private decorationManager: DecorationManager
    ) {
        this.registerCommands();
        this.registerEvents();
    }

    private registerCommands() {
        this.disposables.push(
            vscode.commands.registerCommand("quickBunny.jump", () =>
                this.showJumpPicker()
            )
        );

        this.disposables.push(
            vscode.commands.registerCommand("quickBunny.refresh", () =>
                this.refreshAll()
            )
        );

        this.disposables.push(
            vscode.commands.registerCommand(
                "quickBunny.reveal",
                (mark: MarkEntity) => {
                    if (vscode.window.activeTextEditor) {
                        this.revealMark(vscode.window.activeTextEditor, mark);
                    }
                }
            )
        );

        this.disposables.push(
            vscode.commands.registerCommand("quickBunny.next", () =>
                this.jumpToNeighbor("next")
            )
        );
        this.disposables.push(
            vscode.commands.registerCommand("quickBunny.previous", () =>
                this.jumpToNeighbor("prev")
            )
        );
    }

    private registerEvents() {
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => this.refreshAll())
        );

        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(() => this.refreshAll())
        );

        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument((event) => {
                if (
                    vscode.window.activeTextEditor &&
                    event.document === vscode.window.activeTextEditor.document
                ) {
                    this.triggerDebouncedUpdate();
                }
            })
        );
    }

    /**
     * Aguarda o usuário parar de digitar por 500ms antes de escanear.
     * Isso evita lentidão no editor.
     */
    private triggerDebouncedUpdate() {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            this.refreshAll();
        }, 500);
    }

    private async refreshAll() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const marks = await this.scanner.scanDocument(editor.document);
            this.statusBar.update(marks);
            this.treeProvider.refresh(marks);

            this.decorationManager.updateDecorations(editor, marks);
        } else {
            this.statusBar.hide();
            this.treeProvider.refresh([]);
        }
    }

    private async jumpToNeighbor(direction: "next" | "prev") {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const rootMarks = await this.scanner.scanDocument(editor.document);
        if (rootMarks.length === 0) return;

        const flatMarks = flattenMarks(rootMarks);

        const currentLine = editor.selection.active.line;
        let targetMark: MarkEntity | undefined;

        if (direction === "next") {
            targetMark = flatMarks.find((m) => m.lineNumber > currentLine);
            if (!targetMark) targetMark = flatMarks[0];
        } else {
            const prevMarks = flatMarks.filter(
                (m) => m.lineNumber < currentLine
            );
            targetMark = prevMarks[prevMarks.length - 1];
            if (!targetMark) targetMark = flatMarks[flatMarks.length - 1];
        }

        if (targetMark) this.revealMark(editor, targetMark);
    }

    private revealMark(editor: vscode.TextEditor, mark: MarkEntity) {
        editor.selection = new vscode.Selection(
            mark.range.start,
            mark.range.end
        );
        editor.revealRange(mark.range, vscode.TextEditorRevealType.InCenter);
    }

    private getIconForType(type: string): string {
        const t = type.toUpperCase();
        if (["TODO", "FIXME", "BUG"].includes(t)) return "alert";
        if (["NOTE", "INFO"].includes(t)) return "info";
        if (["SECTION", "MARK"].includes(t)) return "list-unordered";
        return "tag";
    }

    private async showJumpPicker() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const marks = await this.scanner.scanDocument(editor.document);

        interface MarkQuickPickItem extends vscode.QuickPickItem {
            markData: MarkEntity;
        }

        const items: MarkQuickPickItem[] = marks.map((mark) => ({
            label: `$(${this.getIconForType(mark.type)}) ${mark.label}`,
            description: mark.description,
            detail: mark.writer ? `By ${mark.writer}` : "",
            markData: mark,
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: "Jump to a mark...",
        });

        if (selected) {
            this.revealMark(editor, selected.markData);
        }
    }

    dispose() {
        this.disposables.forEach((d) => d.dispose());
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.decorationManager.dispose();
    }
}
