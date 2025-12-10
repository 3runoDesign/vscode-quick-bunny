import * as vscode from "vscode";
import { MarkScanner } from "../core/MarkScanner";
import { MarkEntity } from "../domain/models";
import { StatusBarManager } from "./StatusBarManager";
import { QuickBunnyTreeProvider } from "./TreeProvider";

export class MarkController implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    constructor(
        private scanner: MarkScanner,
        private treeProvider: QuickBunnyTreeProvider,
        private statusBar: StatusBarManager
    ) {
        this.registerCommands();
        this.registerEvents();
    }

    private registerCommands() {
        // Comando Principal (Menu)
        this.disposables.push(
            vscode.commands.registerCommand("quickBunny.jump", () =>
                this.showJumpPicker()
            )
        );

        // Atalho: Atualizar
        this.disposables.push(
            vscode.commands.registerCommand("quickBunny.refresh", () =>
                this.refreshAll()
            )
        );

        // Atalho: Revelar (usado pelo TreeView)
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

        // NOVO: Navegação Rápida (Shorts)
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

    // ... (Métodos registerEvents, refreshAll, showJumpPicker mantidos iguais) ...

    /**
     * Lógica para encontrar o vizinho mais próximo
     */
    private async jumpToNeighbor(direction: "next" | "prev") {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        // 1. Escaneia o documento atual
        const marks = await this.scanner.scanDocument(editor.document);
        if (marks.length === 0) return;

        // 2. Descobre a linha atual do cursor
        const currentLine = editor.selection.active.line;

        // 3. Encontra o alvo
        let targetMark: MarkEntity | undefined;

        if (direction === "next") {
            // Procura o primeiro mark que esteja DEPOIS da linha atual
            targetMark = marks.find((m) => m.lineNumber > currentLine);

            // Se não achar (está no fim), faz o loop para o primeiro (Carrossel)
            if (!targetMark) targetMark = marks[0];
        } else {
            // Procura o marks que estão ANTES da linha atual e pega o último deles
            // Reverse é usado para facilitar pegar o "mais próximo" subindo
            const prevMarks = marks.filter((m) => m.lineNumber < currentLine);
            targetMark = prevMarks[prevMarks.length - 1];

            // Se não achar (está no início), faz o loop para o último (Carrossel)
            if (!targetMark) targetMark = marks[marks.length - 1];
        }

        // 4. Pula para o alvo
        if (targetMark) {
            this.revealMark(editor, targetMark);
        }
    }

    private revealMark(editor: vscode.TextEditor, mark: MarkEntity) {
        editor.selection = new vscode.Selection(
            mark.range.start,
            mark.range.end
        );
        editor.revealRange(mark.range, vscode.TextEditorRevealType.InCenter);
    }

    // ... (restante dos métodos auxiliares e dispose) ...

    // Certifique-se de manter o método getIconForType ou movê-lo para um helper se necessário
    private getIconForType(type: string): string {
        switch (type) {
            case "todo":
                return "pencil";
            case "note":
                return "book";
            case "section":
                return "list-unordered";
            default:
                return "circle-filled";
        }
    }

    // ...
    private registerEvents() {
        // Atualiza UI quando muda o editor
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => this.refreshAll()),
            vscode.workspace.onDidSaveTextDocument(() => this.refreshAll())
        );
    }

    private async refreshAll() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const marks = await this.scanner.scanDocument(editor.document);
            this.statusBar.update(marks);
            this.treeProvider.refresh(marks);
        } else {
            this.statusBar.hide();
        }
    }

    private async showJumpPicker() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const marks = await this.scanner.scanDocument(editor.document);

        // Interface auxiliar para tipagem segura
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
    }
}
