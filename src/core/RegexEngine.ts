import { pattern, regex } from "regex";

export class RegexEngine {
    static createPattern(patternStr: string): RegExp {
        try {
            return regex("gm")`${pattern(patternStr)}`;
        } catch (error) {
            console.error(
                `QuickBunny: Invalid Regex Pattern "${patternStr}"`,
                error
            );
            return /(?!)/;
        }
    }
}
