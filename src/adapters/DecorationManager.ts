import * as path from "path";
import * as vscode from "vscode";
import { MarkEntity } from "../domain/models";

export class DecorationManager implements vscode.Disposable {
    private decorationTypes: Map<string, vscode.TextEditorDecorationType> =
        new Map();
    private context: vscode.ExtensionContext;

    private showHeaders: boolean = true;
    private showBackgrounds: boolean = true;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.reloadConfig();
    }

    public reloadConfig() {
        this.dispose();

        const config = vscode.workspace.getConfiguration("quickBunny");
        this.showHeaders = config.get<boolean>("decorations.showHeaders", true);
        this.showBackgrounds = config.get<boolean>(
            "decorations.showBackgrounds",
            true
        );

        this.createHeaderDecoration("SECTION", "#66bb6a", "list-unordered.svg");
        this.createHeaderDecoration("MARK", "#42a5f5", "list-unordered.svg");
        this.createHeaderDecoration("NOTE", "#29b6f6", "book.svg");
        this.createHeaderDecoration("INFO", "#29b6f6", "info.svg");

        this.createBadgeDecoration("TODO", "#ffbd2a", "pencil.svg");
        this.createBadgeDecoration("FIXME", "#f06292", "alert.svg");
        this.createBadgeDecoration("BUG", "#e53935", "bug.svg");
        this.createBadgeDecoration("HACK", "#ab47bc", "zap.svg");
        this.createBadgeDecoration("REVIEW", "#ffee58", "eye.svg");
    }

    private createHeaderDecoration(
        tag: string,
        color: string,
        iconName: string
    ) {
        const iconPath = this.getIconPath(iconName);

        const borderSettings = this.showHeaders
            ? { borderWidth: "2px 0 0 0", borderColor: color }
            : { borderWidth: "0", borderColor: "transparent" };

        const type = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            fontWeight: "bold",
            color: color,

            borderWidth: borderSettings.borderWidth,
            borderStyle: "solid",
            borderColor: borderSettings.borderColor,

            gutterIconPath: iconPath,
            gutterIconSize: "contain",

            overviewRulerColor: color,
            overviewRulerLane: vscode.OverviewRulerLane.Center,
        });

        this.decorationTypes.set(tag, type);
    }

    private createBadgeDecoration(
        tag: string,
        color: string,
        iconName: string
    ) {
        const iconPath = this.getIconPath(iconName);

        const bgColor = this.showBackgrounds ? color : "transparent";
        const textColor = this.showBackgrounds ? "#ffffff" : color;

        const border = this.showBackgrounds
            ? "1px solid transparent"
            : `1px solid ${color}`;

        const type = vscode.window.createTextEditorDecorationType({
            isWholeLine: false,
            fontWeight: "bold",
            color: textColor,
            backgroundColor: bgColor,
            border: border,
            borderRadius: "3px",
            textDecoration: "none; padding-right: 0px",
            gutterIconPath: iconPath,
            gutterIconSize: "contain",

            overviewRulerColor: color,
            overviewRulerLane: vscode.OverviewRulerLane.Right,
        });

        this.decorationTypes.set(tag, type);
    }

    private getIconPath(iconName: string): string | undefined {
        try {
            return this.context.asAbsolutePath(
                path.join("images", "octicons", "light", iconName)
            );
        } catch (e) {
            return undefined;
        }
    }

    public updateDecorations(editor: vscode.TextEditor, marks: MarkEntity[]) {
        const rangesByTag = new Map<string, vscode.Range[]>();

        this.decorationTypes.forEach((_, tag) => rangesByTag.set(tag, []));
        const defaultTag = "DEFAULT";

        if (!this.decorationTypes.has(defaultTag)) {
            this.createBadgeDecoration(defaultTag, "#757575", "tag.svg");
            rangesByTag.set(defaultTag, []);
        }

        const collectRanges = (entity: MarkEntity) => {
            let tag = entity.type.toUpperCase();
            if (!this.decorationTypes.has(tag)) tag = defaultTag;

            if (this.decorationTypes.has(tag)) {
                if (entity.type !== "method") {
                    const list = rangesByTag.get(tag);
                    if (list) list.push(entity.range);
                }
            }
            if (entity.children) entity.children.forEach(collectRanges);
        };

        marks.forEach(collectRanges);

        this.decorationTypes.forEach((decorationType, tag) => {
            const ranges = rangesByTag.get(tag) || [];
            editor.setDecorations(decorationType, ranges);
        });
    }

    dispose() {
        this.decorationTypes.forEach((d) => d.dispose());
        this.decorationTypes.clear();
    }
}
