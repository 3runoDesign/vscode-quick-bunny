import * as vscode from "vscode";

// Aqui está o MarkType
export type MarkType = "section" | "todo" | "note";

// Aqui está a interface MarkEntity
export interface MarkEntity {
    id: string;
    uri: vscode.Uri;
    lineNumber: number;
    range: vscode.Range;
    type: MarkType;
    label: string;
    description: string;
    headingLevel?: number;
    writer?: string;
}

export interface ScanOptions {
    limit?: number;
    includePatterns: string[];
    excludePatterns: string[];
}
