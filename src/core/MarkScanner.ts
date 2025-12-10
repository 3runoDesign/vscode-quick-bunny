import * as fs from "fs";
import * as vscode from "vscode";
import { MarkEntity, MarkType } from "../domain/models";
import { RegexEngine } from "./RegexEngine";

export class MarkScanner {
    // Mapeia configurações para Tipos
    private getPatterns(
        config: vscode.WorkspaceConfiguration,
        type: MarkType
    ): string[] {
        const key =
            type === "todo"
                ? "todoPatterns"
                : type === "note"
                ? "notePatterns"
                : "sectionPatterns";
        const extraKey =
            type === "todo"
                ? "additionalTODOPatterns"
                : type === "note"
                ? "additionalNotePatterns"
                : "additionalSectionPatterns";

        return [
            ...config.get<string[]>(key, []),
            ...config.get<string[]>(extraKey, []),
        ];
    }

    /**
     * Escaneia uma única linha de texto
     */
    public scanLine(
        lineText: string,
        lineNumber: number,
        uri: vscode.Uri,
        config: vscode.WorkspaceConfiguration
    ): MarkEntity | null {
        const types: MarkType[] = ["section", "todo", "note"];

        for (const type of types) {
            const patterns = this.getPatterns(config, type);

            for (const patternStr of patterns) {
                const re = RegexEngine.createPattern(patternStr);
                const match = re.exec(lineText);

                if (match) {
                    // A nova lib 'regex' e ES6+ usam match.groups
                    const groups = match.groups || {};
                    const heading = groups.heading || "";
                    const description = groups.description || match[0]; // Fallback para o match inteiro
                    const writer = groups.writer;

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
                        label: description,
                        headingLevel: heading.length,
                        writer: writer,
                        description: `Line ${lineNumber + 1}`,
                    };
                }
            }
        }
        return null;
    }

    public async scanDocument(
        document: vscode.TextDocument
    ): Promise<MarkEntity[]> {
        const config = vscode.workspace.getConfiguration("quickBunny");
        const marks: MarkEntity[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            if (line.isEmptyOrWhitespace) continue;

            const mark = this.scanLine(line.text, i, document.uri, config);
            if (mark) marks.push(mark);
        }
        return marks;
    }

    public async scanFile(uri: vscode.Uri): Promise<MarkEntity[]> {
        const config = vscode.workspace.getConfiguration("quickBunny");
        try {
            const content = await fs.promises.readFile(uri.fsPath, "utf8");
            const lines = content.split("\n");
            const marks: MarkEntity[] = [];

            lines.forEach((lineText, index) => {
                const mark = this.scanLine(lineText, index, uri, config);
                if (mark) marks.push(mark);
            });
            return marks;
        } catch (e) {
            console.error(`QuickBunny: Failed to read file ${uri.fsPath}`);
            return [];
        }
    }
}
