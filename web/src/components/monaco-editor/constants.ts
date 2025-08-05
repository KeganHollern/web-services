export const DEFAULT_CONTENT = `# Secret Title

Write your secret below in **Markdown**.

## Instructions

- Press **CTRL+S** to save your secret.
- The secret is **one-time-use**: once you generate the link, do not visit it before sharing, or it will be deleted.
- Use **bold** text for emphasis.
- Use *italic* text for subtle highlights.
- Add [links](https://example.com) if needed.
- Use \`inline code\` for short code snippets.

> Keep your secrets safe and secure.

\`\`\`
# Code block
print("This is an example of a code block.")
\`\`\`
`


export const flexokiTheme = {
    base: "vs-dark",
    inherit: true,
    rules: [
        { token: "", foreground: "cecdc3" },
        { token: "comment", foreground: "878580" },
        { token: "string", foreground: "3aa99f" },
        { token: "keyword", foreground: "879a39" },
        { token: "number", foreground: "8b7ec8" },
        { token: "operator", foreground: "d14d41" },
        { token: "type", foreground: "d0a215" },
        { token: "class", foreground: "da702c" },
        { token: "function", foreground: "da702c", fontStyle: "bold" },
        { token: "variable", foreground: "cecdc3" },
        { token: "variable.readonly", foreground: "879a39" },
        { token: "parameter", foreground: "cecdc3" },
        { token: "property", foreground: "4385be" },
        { token: "constant.language.boolean", foreground: "d0a215" },
        { token: "constant.numeric", foreground: "8b7ec8" },
        { token: "entity.name.tag", foreground: "4385be" },
        { token: "entity.name.type.class", foreground: "da702c" },
        { token: "entity.name.type.interface", foreground: "d0a215" },
        { token: "entity.name.function", foreground: "cecdc3" },
        { token: "punctuation", foreground: "878580" },
        { token: "decorator", foreground: "d0a215" },
    ],
    colors: {
        "editor.background": "#100F0F",
        "editor.foreground": "#CECDC3",
        "editor.lineHighlightBackground": "#1C1B1A",
        "editor.selectionBackground": "#CECDC333",
        "editor.selectionHighlightBackground": "#CECDC333",
        "editor.findMatchBackground": "#AD8301",
        "editor.findMatchHighlightBackground": "#AD8301cc",
        "editor.findRangeHighlightBackground": "#1C1B1A",
        "editor.inactiveSelectionBackground": "#282726",
        "editor.lineHighlightBorder": "#282726",
        "editor.rangeHighlightBackground": "#403E3C",
        "editorBracketMatch.background": "#282726",
        "editorBracketMatch.border": "#343331",
        "editorGutter.background": "#100F0F",
        "editorGutter.modifiedBackground": "#3AA99F",
        "editorGutter.addedBackground": "#879A39",
        "editorGutter.deletedBackground": "#D14D41",
        "editorCursor.foreground": "#CECDC3",
        "editorWhitespace.foreground": "#403E3C",
        "editorIndentGuide.background": "#343331",
        "editorLineNumber.foreground": "#403E3C",
        "editorLineNumber.activeForeground": "#CECDC3",
        "editorSuggestWidget.background": "#100F0F",
        "editorSuggestWidget.border": "#343331",
        "editorSuggestWidget.foreground": "#CECDC3",
        "editorSuggestWidget.selectedBackground": "#343331",
        "editorSuggestWidget.highlightForeground": "#878580",
    },
};