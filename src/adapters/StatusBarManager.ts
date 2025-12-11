import * as vscode from "vscode";
import { MarkEntity } from "../domain/models";

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            10
        );
        this.statusBarItem.command = "quickBunny.jump";
    }

    public update(marks: MarkEntity[]) {
        if (!marks || marks.length === 0) {
            this.statusBarItem.hide();
            return;
        }
        const counts = {
            mark: 0,
            section: 0,
            todo: 0,
            note: 0,
        };

        marks.forEach((mark) => {
            if (counts[mark.type] !== undefined) {
                counts[mark.type]++;
            }
        });

        const parts: string[] = [];
        if (counts.section > 0)
            parts.push(`$(list-unordered) ${counts.section}`);
        if (counts.todo > 0) parts.push(`$(pencil) ${counts.todo}`);
        if (counts.note > 0) parts.push(`$(book) ${counts.note}`);

        this.statusBarItem.text = parts.join("  ");

        this.statusBarItem.tooltip =
            `QuickBunny Stats\n` +
            `- Marks: ${counts.mark}\n` +
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
