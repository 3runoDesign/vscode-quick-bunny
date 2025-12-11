import * as vscode from "vscode";

export type MarkType = string;

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
    children?: MarkEntity[];
}

export interface ScanOptions {
    limit?: number;
    includePatterns: string[];
    excludePatterns: string[];
}
