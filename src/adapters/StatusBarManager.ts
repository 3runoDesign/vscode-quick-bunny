import * as vscode from "vscode";
import { MarkEntity } from "../domain/models";

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        // Cria o item alinhado à esquerda com prioridade 10
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            10
        );
        this.statusBarItem.command = "quickBunny.jump"; // Clicar abre o menu de pulo
    }

    /**
     * Atualiza o texto da status bar com base nas marcas encontradas.
     */
    public update(marks: MarkEntity[]) {
        if (!marks || marks.length === 0) {
            this.statusBarItem.hide();
            return;
        }

        // Agregação simples (Lógica de apresentação)
        const counts = {
            section: 0,
            todo: 0,
            note: 0,
        };

        marks.forEach((mark) => {
            if (counts[mark.type] !== undefined) {
                counts[mark.type]++;
            }
        });

        // Monta o texto usando Product Icons do VS Code ($(icon))
        // Docs: https://code.visualstudio.com/api/references/icons-in-labels
        const parts: string[] = [];
        if (counts.section > 0)
            parts.push(`$(list-unordered) ${counts.section}`);
        if (counts.todo > 0) parts.push(`$(pencil) ${counts.todo}`);
        if (counts.note > 0) parts.push(`$(book) ${counts.note}`);

        this.statusBarItem.text = parts.join("  ");

        // Tooltip rica
        this.statusBarItem.tooltip =
            `QuickBunny Stats\n` +
            `- Sections: ${counts.section}\n` +
            `- TODOs: ${counts.todo}\n` +
            `- Notes: ${counts.note}`;

        this.statusBarItem.show();
    }

    public hide() {
        this.statusBarItem.hide();
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}
