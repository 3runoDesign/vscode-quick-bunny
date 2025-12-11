import * as fs from "fs";
import * as vscode from "vscode";
import { MarkEntity } from "../domain/models";

export class MarkScanner {
    private methodRegex =
        /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:(?:var|let|const|function|class)\s+)?([a-zA-Z0-9_$]+)\s*(?:(?:=|:)\s*(?:async\s+)?(?:function\s*)?(?:\(|[^;{]+=>)|\()/;

    private getRegex(): RegExp {
        const config = vscode.workspace.getConfiguration("quickBunny");
        const tags = config.get<string[]>("tags", [
            "TODO",
            "FIXME",
            "NOTE",
            "INFO",
            "SECTION",
            "MARK",
            "BUG",
            "HACK",
        ]);
        const tagsPattern = tags
            .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
            .join("|");
        return new RegExp(
            `(\\/\\/|#|\\/\\*)\\s*(${tagsPattern})[:\\s]+(.*?)(?:\\*\\/)?$`,
            "gmi"
        );
    }

    private scanMethod(
        lineText: string,
        lineNumber: number,
        uri: vscode.Uri
    ): MarkEntity | null {
        if (/^\s*(if|for|while|switch|catch|return)\b/.test(lineText))
            return null;

        const match = this.methodRegex.exec(lineText);
        if (match) {
            const methodName = match[1];
            if (methodName === "constructor") return null;

            return {
                id: `${uri.toString()}:method:${lineNumber}`,
                uri: uri,
                lineNumber: lineNumber,
                range: new vscode.Range(
                    lineNumber,
                    0,
                    lineNumber,
                    lineText.length
                ),
                type: "method",
                label: `${methodName}()`,
                description: `Line ${lineNumber + 1}`,
                children: [],
            };
        }
        return null;
    }

    public scanLine(
        lineText: string,
        lineNumber: number,
        uri: vscode.Uri
    ): MarkEntity | null {
        const regex = this.getRegex();
        const match = regex.exec(lineText);

        if (match) {
            const type = match[2].toUpperCase();
            const content = match[3].trim();
            if (!content) return null;

            return {
                id: `${uri.toString()}:${lineNumber}`,
                uri: uri,
                lineNumber: lineNumber,
                range: new vscode.Range(
                    lineNumber,
                    0,
                    lineNumber,
                    lineText.length
                ),
                type: type,
                label: content,
                description: `Line ${lineNumber + 1}`,
                children: [],
            };
        }
        return null;
    }

    public async scanDocument(
        document: vscode.TextDocument
    ): Promise<MarkEntity[]> {
        const marks: MarkEntity[] = [];
        let currentParent: MarkEntity | null = null;

        const isScriptFile = [
            "javascript",
            "typescript",
            "javascriptreact",
            "typescriptreact",
        ].includes(document.languageId);

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (line.isEmptyOrWhitespace) continue;

            const mark = this.scanLine(line.text, i, document.uri);

            if (mark) {
                if (["MARK", "SECTION"].includes(mark.type.toUpperCase())) {
                    currentParent = mark;
                    marks.push(mark);
                } else {
                    marks.push(mark);
                }
                continue;
            }

            if (isScriptFile && currentParent) {
                const methodMark = this.scanMethod(line.text, i, document.uri);
                if (methodMark) {
                    if (!currentParent.children) currentParent.children = [];
                    currentParent.children.push(methodMark);
                }
            }
        }
        return marks;
    }

    public async scanFile(uri: vscode.Uri): Promise<MarkEntity[]> {
        try {
            const content = await fs.promises.readFile(uri.fsPath, "utf8");
            const lines = content.split("\n");
            const marks: MarkEntity[] = [];
            lines.forEach((lineText, index) => {
                const mark = this.scanLine(lineText, index, uri);
                if (mark) marks.push(mark);
            });
            return marks;
        } catch (e) {
            return [];
        }
    }
}
