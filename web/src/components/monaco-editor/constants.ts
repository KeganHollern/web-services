import type { editor } from 'monaco-editor';

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


// https://github.com/kepano/flexoki/tree/main/vscode
export const flexokiThemeDark: editor.IStandaloneThemeData = {
    "inherit": true,
    "base": "vs-dark",
    "colors": {
        "editor.background": "#100F0F",
        "editor.foreground": "#CECDC3",
        "editor.hoverHighlightBackground": "#343331",
        "editor.lineHighlightBackground": "#1C1B1A",
        "editor.selectionBackground": "#CECDC333",
        "editor.selectionHighlightBackground": "#CECDC333",
        "editor.findMatchBackground": "#AD8301",
        "editor.findMatchHighlightBackground": "#AD8301cc",
        "editor.findRangeHighlightBackground": "#1C1B1A",
        "editor.inactiveSelectionBackground": "#282726",
        "editor.lineHighlightBorder": "#282726",
        "editor.rangeHighlightBackground": "#403E3C",
        "notifications.background": "#282726",
        "editorInlayHint.typeBackground": "#343331",
        "editorInlayHint.typeForeground": "#CECDC3",
        "editorWhitespace.foreground": "#403E3C",
        "editorIndentGuide.background1": "#343331",
        "editorHoverWidget.background": "#282726",
        "editorLineNumber.activeForeground": "#CECDC3",
        "editorLineNumber.foreground": "#403E3C",
        "editorGutter.background": "#100F0F",
        "editorGutter.modifiedBackground": "#3AA99F",
        "editorGutter.addedBackground": "#879A39",
        "editorGutter.deletedBackground": "#D14D41",
        "editorBracketMatch.background": "#282726",
        "editorBracketMatch.border": "#343331",
        "editorError.foreground": "#D14D41",
        "editorWarning.foreground": "#DA702C",
        "editorInfo.foreground": "#4385BE",
        "diffEditor.insertedTextBackground": "#66800B99",
        "diffEditor.removedTextBackground": "#AF302999",
        "editorGroupHeader.tabsBackground": "#100F0F",
        "editorGroup.border": "#343331",
        "tab.activeBackground": "#100F0F",
        "tab.inactiveBackground": "#1C1B1A",
        "tab.inactiveForeground": "#878580",
        "tab.activeForeground": "#CECDC3",
        "tab.hoverBackground": "#343331",
        "tab.unfocusedHoverBackground": "#343331",
        "tab.border": "#343331",
        "tab.activeModifiedBorder": "#D0A215",
        "tab.inactiveModifiedBorder": "#4385BE",
        "tab.unfocusedActiveModifiedBorder": "#AD8301",
        "tab.unfocusedInactiveModifiedBorder": "#205EA6",
        "editorWidget.background": "#1C1B1A",
        "editorWidget.border": "#343331",
        "editorSuggestWidget.background": "#100F0F",
        "editorSuggestWidget.border": "#343331",
        "editorSuggestWidget.foreground": "#CECDC3",
        "editorSuggestWidget.highlightForeground": "#878580",
        "editorSuggestWidget.selectedBackground": "#343331",
        "peekView.border": "#343331",
        "peekViewEditor.background": "#100F0F",
        "peekViewEditor.matchHighlightBackground": "#403E3C",
        "peekViewResult.background": "#1C1B1A",
        "peekViewResult.fileForeground": "#CECDC3",
        "peekViewResult.lineForeground": "#878580",
        "peekViewResult.matchHighlightBackground": "#403E3C",
        "peekViewResult.selectionBackground": "#282726",
        "peekViewResult.selectionForeground": "#575653",
        "peekViewTitle.background": "#343331",
        "peekViewTitleDescription.foreground": "#878580",
        "peekViewTitleLabel.foreground": "#CECDC3",
        "merge.currentHeaderBackground": "#879A39",
        "merge.currentContentBackground": "#66800B",
        "merge.incomingHeaderBackground": "#3AA99F",
        "merge.incomingContentBackground": "#24837B",
        "merge.border": "#343331",
        "merge.commonContentBackground": "#403E3C",
        "merge.commonHeaderBackground": "#343331",
        "panel.background": "#100F0F",
        "panel.border": "#343331",
        "panelTitle.activeBorder": "#403E3C",
        "panelTitle.activeForeground": "#CECDC3",
        "panelTitle.inactiveForeground": "#878580",
        "statusBar.background": "#100F0F",
        "statusBar.foreground": "#CECDC3",
        "statusBar.border": "#343331",
        "statusBar.debuggingBackground": "#D14D41",
        "statusBar.debuggingForeground": "#CECDC3",
        "statusBar.noFolderBackground": "#403E3C",
        "statusBar.noFolderForeground": "#575653",
        "titleBar.activeBackground": "#100F0F",
        "titleBar.activeForeground": "#CECDC3",
        "titleBar.inactiveBackground": "#1C1B1A",
        "titleBar.inactiveForeground": "#878580",
        "titleBar.border": "#343331",
        "menu.foreground": "#CECDC3",
        "menu.background": "#100F0F",
        "menu.selectionForeground": "#CECDC3",
        "menu.selectionBackground": "#343331",
        "menu.border": "#343331",
        "editorInlayHint.foreground": "#878580",
        "editorInlayHint.background": "#343331",
        "terminal.foreground": "#CECDC3",
        "terminal.background": "#100F0F",
        "terminalCursor.foreground": "#CECDC3",
        "terminalCursor.background": "#100F0F",
        "terminal.ansiRed": "#D14D41",
        "terminal.ansiGreen": "#879A39",
        "terminal.ansiYellow": "#D0A215",
        "terminal.ansiBlue": "#4385BE",
        "terminal.ansiMagenta": "#3AA99F",
        "terminal.ansiCyan": "#3AA99F",
        "activityBar.background": "#100F0F",
        "activityBar.foreground": "#CECDC3",
        "activityBar.inactiveForeground": "#878580",
        "activityBar.activeBorder": "#CECDC3",
        "activityBar.border": "#343331",
        "sideBar.background": "#100F0F",
        "sideBar.foreground": "#CECDC3",
        "sideBar.border": "#343331",
        "sideBarTitle.foreground": "#CECDC3",
        "sideBarSectionHeader.background": "#1C1B1A",
        "sideBarSectionHeader.foreground": "#CECDC3",
        "sideBarSectionHeader.border": "#343331",
        "sideBar.activeBackground": "#403E3C",
        "sideBar.activeForeground": "#CECDC3",
        "sideBar.hoverBackground": "#343331",
        "sideBar.hoverForeground": "#878580",
        "sideBar.folderIcon.foreground": "#879A39",
        "sideBar.fileIcon.foreground": "#4385BE",
        "list.warningForeground": "#DA702C",
        "list.errorForeground": "#D14D41",
        "list.inactiveSelectionBackground": "#343331",
        "list.activeSelectionBackground": "#403E3C",
        "list.inactiveSelectionForeground": "#CECDC3",
        "list.activeSelectionForeground": "#CECDC3",
        "list.hoverForeground": "#CECDC3",
        "list.hoverBackground": "#343331",
        "input.background": "#1C1B1A",
        "input.foreground": "#CECDC3",
        "input.border": "#343331",
        "input.placeholderForeground": "#878580",
        "inputOption.activeBorder": "#343331",
        "inputOption.activeBackground": "#282726",
        "inputOption.activeForeground": "#CECDC3",
        "inputValidation.infoBackground": "#3AA99F",
        "inputValidation.infoBorder": "#24837B",
        "inputValidation.warningBackground": "#DA702C",
        "inputValidation.warningBorder": "#BC5215",
        "inputValidation.errorBackground": "#D14D41",
        "inputValidation.errorBorder": "#AF3029",
        "dropdown.background": "#1C1B1A",
        "dropdown.foreground": "#CECDC3",
        "dropdown.border": "#343331",
        "dropdown.listBackground": "#100F0F",
        "badge.background": "#3AA99F",
        "activityBarBadge.background": "#3AA99F",
        "button.background": "#3AA99F",
        "button.foreground": "#100F0F",
        "badge.foreground": "#100F0F",
        "activityBarBadge.foreground": "#100F0F"
    },
    "rules": [
        {
            "foreground": "#CECDC3",
            "token": "source"
        },
        {
            "foreground": "#CECDC3",
            "token": "support.type.property-name.css"
        },
        {
            "foreground": "#DA702C",
            "token": "entity.name.type.class"
        },
        {
            "foreground": "#D0A215",
            "token": "entity.name.type.interface"
        },
        {
            "foreground": "#D0A215",
            "token": "entity.name.type"
        },
        {
            "foreground": "#DA702C",
            "token": "entity.name.type.struct"
        },
        {
            "foreground": "#DA702C",
            "token": "entity.name.type.enum"
        },
        {
            "foreground": "#DA702C",
            "token": "meta.object-literal.key"
        },
        {
            "foreground": "#DA702C",
            "token": "support.type.property-name"
        },
        {
            "foreground": "#879A39",
            "token": "entity.name.function.method"
        },
        {
            "foreground": "#879A39",
            "token": "meta.function.method"
        },
        {
            "foreground": "#DA702C",
            "fontStyle": "bold",
            "token": "entity.name.function"
        },
        {
            "foreground": "#DA702C",
            "fontStyle": "bold",
            "token": "support.function"
        },
        {
            "foreground": "#DA702C",
            "fontStyle": "bold",
            "token": "meta.function-call.generic"
        },
        {
            "foreground": "#CECDC3",
            "token": "variable"
        },
        {
            "foreground": "#CECDC3",
            "token": "meta.variable"
        },
        {
            "foreground": "#CECDC3",
            "token": "variable.other.object.property"
        },
        {
            "foreground": "#879A39",
            "token": "variable.other.object"
        },
        {
            "foreground": "#879A39",
            "token": "variable.other.readwrite.alias"
        },
        {
            "foreground": "#CE5D97",
            "token": "variable.other.global"
        },
        {
            "foreground": "#CE5D97",
            "token": "variable.language.this"
        },
        {
            "foreground": "#282726",
            "token": "variable.other.local"
        },
        {
            "foreground": "#CECDC3",
            "token": "variable.parameter"
        },
        {
            "foreground": "#CECDC3",
            "token": "meta.parameter"
        },
        {
            "foreground": "#4385BE",
            "token": "variable.other.property"
        },
        {
            "foreground": "#4385BE",
            "token": "meta.property"
        },
        {
            "foreground": "#3AA99F",
            "token": "string"
        },
        {
            "foreground": "#3AA99F",
            "token": "string.other.link"
        },
        {
            "foreground": "#3AA99F",
            "token": "markup.inline.raw.string.markdown"
        },
        {
            "foreground": "#CECDC3",
            "token": "constant.character.escape"
        },
        {
            "foreground": "#CECDC3",
            "token": "constant.other.placeholder"
        },
        {
            "foreground": "#879A39",
            "token": "keyword"
        },
        {
            "foreground": "#D14D41",
            "token": "keyword.control.import"
        },
        {
            "foreground": "#D14D41",
            "token": "keyword.control.from"
        },
        {
            "foreground": "#D14D41",
            "token": "keyword.import"
        },
        {
            "foreground": "#4385BE",
            "token": "storage.modifier"
        },
        {
            "foreground": "#4385BE",
            "token": "keyword.modifier"
        },
        {
            "foreground": "#4385BE",
            "token": "storage.type"
        },
        {
            "foreground": "#878580",
            "token": "comment"
        },
        {
            "foreground": "#878580",
            "token": "punctuation.definition.comment"
        },
        {
            "foreground": "#575653",
            "token": "comment.documentation"
        },
        {
            "foreground": "#575653",
            "token": "comment.line.documentation"
        },
        {
            "foreground": "#8B7EC8",
            "token": "constant.numeric"
        },
        {
            "foreground": "#D0A215",
            "token": "constant.language.boolean"
        },
        {
            "foreground": "#D0A215",
            "token": "constant.language.json"
        },
        {
            "foreground": "#D14D41",
            "token": "keyword.operator"
        },
        {
            "foreground": "#4385BE",
            "token": "entity.name.function.preprocessor"
        },
        {
            "foreground": "#4385BE",
            "token": "meta.preprocessor"
        },
        {
            "foreground": "#CE5D97",
            "token": "meta.preprocessor"
        },
        {
            "foreground": "#4385BE",
            "token": "markup.underline.link"
        },
        {
            "foreground": "#4385BE",
            "token": "entity.name.tag"
        },
        {
            "foreground": "#CE5D97",
            "token": "support.class.component"
        },
        {
            "foreground": "#D0A215",
            "token": "entity.other.attribute-name"
        },
        {
            "foreground": "#D0A215",
            "token": "meta.attribute"
        },
        {
            "foreground": "#D0A215",
            "token": "support.type"
        },
        {
            "foreground": "#CECDC3",
            "token": "variable.other.constant"
        },
        {
            "foreground": "#CECDC3",
            "token": "variable.readonly"
        },
        {
            "foreground": "#CE5D97",
            "token": "entity.name.label"
        },
        {
            "foreground": "#CE5D97",
            "token": "punctuation.definition.label"
        },
        {
            "foreground": "#D0A215",
            "token": "entity.name.namespace"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.modifier.namespace"
        },
        {
            "foreground": "#D0A215",
            "token": "markup.bold.markdown"
        },
        {
            "foreground": "#D14D41",
            "token": "entity.name.module"
        },
        {
            "foreground": "#D14D41",
            "token": "storage.modifier.module"
        },
        {
            "foreground": "#DA702C",
            "token": "variable.type.parameter"
        },
        {
            "foreground": "#DA702C",
            "token": "variable.parameter.type"
        },
        {
            "foreground": "#CE5D97",
            "token": "keyword.control.exception"
        },
        {
            "foreground": "#CE5D97",
            "token": "keyword.control.trycatch"
        },
        {
            "foreground": "#D0A215",
            "token": "meta.decorator"
        },
        {
            "foreground": "#D0A215",
            "token": "punctuation.decorator"
        },
        {
            "foreground": "#D0A215",
            "token": "entity.name.function.decorator"
        },
        {
            "foreground": "#CECDC3",
            "token": "variable.function"
        },
        {
            "foreground": "#878580",
            "token": "punctuation"
        },
        {
            "foreground": "#878580",
            "token": "punctuation.terminator"
        },
        {
            "foreground": "#878580",
            "token": "punctuation.definition.tag"
        },
        {
            "foreground": "#878580",
            "token": "punctuation.separator"
        },
        {
            "foreground": "#878580",
            "token": "punctuation.definition.string"
        },
        {
            "foreground": "#878580",
            "token": "punctuation.section.block"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.type.numeric.go"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.type.byte.go"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.type.boolean.go"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.type.string.go"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.type.uintptr.go"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.type.error.go"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.type.rune.go"
        },
        {
            "foreground": "#D0A215",
            "token": "constant.language.go"
        },
        {
            "foreground": "#D0A215",
            "token": "support.class.dart"
        },
        {
            "foreground": "#D0A215",
            "token": "keyword.other.documentation"
        },
        {
            "foreground": "#D0A215",
            "token": "storage.modifier.import.java"
        },
        {
            "foreground": "#D0A215",
            "token": "punctuation.definition.list.begin.markdown"
        },
        {
            "foreground": "#D0A215",
            "token": "punctuation.definition.quote.begin.markdown"
        },
        {
            "foreground": "#D0A215",
            "token": "meta.separator.markdown"
        },
        {
            "foreground": "#D0A215",
            "token": "entity.name.section.markdown"
        },
        {
            "foreground": "#3AA99F",
            "token": "markup.italic.markdown"
        },
        {
            "foreground": "#3AA99F",
            "token": "support.type.python"
        },
        {
            "foreground": "#3AA99F",
            "token": "variable.legacy.builtin.python"
        },
        {
            "foreground": "#3AA99F",
            "token": "support.constant.property-value.css"
        },
        {
            "foreground": "#3AA99F",
            "token": "storage.modifier.attribute.swift"
        },
        {
            "foreground": "#8B7EC8",
            "token": "keyword.channel.go"
        },
        {
            "foreground": "#8B7EC8",
            "token": "keyword.other.platform.os.swift"
        },
        {
            "foreground": "#CE5D97",
            "token": "punctuation.definition.heading.markdown"
        }
    ],
    "encodedTokensColors": []
};
export const flexokiThemeLight: editor.IStandaloneThemeData = {
    "inherit": true,
    "base": "vs",
    "colors": {
        "editor.background": "#FFFCF0",
        "editor.foreground": "#100F0F",
        "editor.hoverHighlightBackground": "#DAD8CE",
        "editor.lineHighlightBackground": "#F2F0E5",
        "editor.selectionBackground": "#100F0F44",
        "editor.selectionHighlightBackground": "#100F0F44",
        "editor.findMatchBackground": "#D0A215",
        "editor.findMatchHighlightBackground": "#D0A215cc",
        "editor.findRangeHighlightBackground": "#F2F0E5",
        "editor.inactiveSelectionBackground": "#E6E4D9",
        "editor.lineHighlightBorder": "#E6E4D9",
        "editor.rangeHighlightBackground": "#CECDC3",
        "notifications.background": "#E6E4D9",
        "editorInlayHint.typeBackground": "#DAD8CE",
        "editorInlayHint.typeForeground": "#100F0F",
        "editorWhitespace.foreground": "#CECDC3",
        "editorIndentGuide.background1": "#DAD8CE",
        "editorHoverWidget.background": "#E6E4D9",
        "editorLineNumber.activeForeground": "#100F0F",
        "editorLineNumber.foreground": "#CECDC3",
        "editorGutter.background": "#FFFCF0",
        "editorGutter.modifiedBackground": "#24837B",
        "editorGutter.addedBackground": "#66800B",
        "editorGutter.deletedBackground": "#AF3029",
        "editorBracketMatch.background": "#E6E4D9",
        "editorBracketMatch.border": "#DAD8CE",
        "editorError.foreground": "#AF3029",
        "editorWarning.foreground": "#BC5215",
        "editorInfo.foreground": "#205EA6",
        "diffEditor.insertedTextBackground": "#879A3999",
        "diffEditor.removedTextBackground": "#D14D4199",
        "editorGroupHeader.tabsBackground": "#FFFCF0",
        "editorGroup.border": "#DAD8CE",
        "tab.activeBackground": "#FFFCF0",
        "tab.inactiveBackground": "#F2F0E5",
        "tab.inactiveForeground": "#6F6E69",
        "tab.activeForeground": "#100F0F",
        "tab.hoverBackground": "#DAD8CE",
        "tab.unfocusedHoverBackground": "#DAD8CE",
        "tab.border": "#DAD8CE",
        "tab.activeModifiedBorder": "#AD8301",
        "tab.inactiveModifiedBorder": "#205EA6",
        "tab.unfocusedActiveModifiedBorder": "#D0A215",
        "tab.unfocusedInactiveModifiedBorder": "#4385BE",
        "editorWidget.background": "#F2F0E5",
        "editorWidget.border": "#DAD8CE",
        "editorSuggestWidget.background": "#FFFCF0",
        "editorSuggestWidget.border": "#DAD8CE",
        "editorSuggestWidget.foreground": "#100F0F",
        "editorSuggestWidget.highlightForeground": "#6F6E69",
        "editorSuggestWidget.selectedBackground": "#DAD8CE",
        "peekView.border": "#DAD8CE",
        "peekViewEditor.background": "#FFFCF0",
        "peekViewEditor.matchHighlightBackground": "#CECDC3",
        "peekViewResult.background": "#F2F0E5",
        "peekViewResult.fileForeground": "#100F0F",
        "peekViewResult.lineForeground": "#6F6E69",
        "peekViewResult.matchHighlightBackground": "#CECDC3",
        "peekViewResult.selectionBackground": "#E6E4D9",
        "peekViewResult.selectionForeground": "#B7B5AC",
        "peekViewTitle.background": "#DAD8CE",
        "peekViewTitleDescription.foreground": "#6F6E69",
        "peekViewTitleLabel.foreground": "#100F0F",
        "merge.currentHeaderBackground": "#66800B",
        "merge.currentContentBackground": "#879A39",
        "merge.incomingHeaderBackground": "#24837B",
        "merge.incomingContentBackground": "#3AA99F",
        "merge.border": "#DAD8CE",
        "merge.commonContentBackground": "#CECDC3",
        "merge.commonHeaderBackground": "#DAD8CE",
        "panel.background": "#FFFCF0",
        "panel.border": "#DAD8CE",
        "panelTitle.activeBorder": "#CECDC3",
        "panelTitle.activeForeground": "#100F0F",
        "panelTitle.inactiveForeground": "#6F6E69",
        "statusBar.background": "#FFFCF0",
        "statusBar.foreground": "#100F0F",
        "statusBar.border": "#DAD8CE",
        "statusBar.debuggingBackground": "#AF3029",
        "statusBar.debuggingForeground": "#100F0F",
        "statusBar.noFolderBackground": "#CECDC3",
        "statusBar.noFolderForeground": "#B7B5AC",
        "titleBar.activeBackground": "#FFFCF0",
        "titleBar.activeForeground": "#100F0F",
        "titleBar.inactiveBackground": "#F2F0E5",
        "titleBar.inactiveForeground": "#6F6E69",
        "titleBar.border": "#DAD8CE",
        "menu.foreground": "#100F0F",
        "menu.background": "#FFFCF0",
        "menu.selectionForeground": "#100F0F",
        "menu.selectionBackground": "#DAD8CE",
        "menu.border": "#DAD8CE",
        "editorInlayHint.foreground": "#6F6E69",
        "editorInlayHint.background": "#DAD8CE",
        "terminal.foreground": "#100F0F",
        "terminal.background": "#FFFCF0",
        "terminalCursor.foreground": "#100F0F",
        "terminalCursor.background": "#FFFCF0",
        "terminal.ansiRed": "#AF3029",
        "terminal.ansiGreen": "#66800B",
        "terminal.ansiYellow": "#AD8301",
        "terminal.ansiBlue": "#205EA6",
        "terminal.ansiMagenta": "#24837B",
        "terminal.ansiCyan": "#24837B",
        "activityBar.background": "#FFFCF0",
        "activityBar.foreground": "#100F0F",
        "activityBar.inactiveForeground": "#6F6E69",
        "activityBar.activeBorder": "#100F0F",
        "activityBar.border": "#DAD8CE",
        "sideBar.background": "#FFFCF0",
        "sideBar.foreground": "#100F0F",
        "sideBar.border": "#DAD8CE",
        "sideBarTitle.foreground": "#100F0F",
        "sideBarSectionHeader.background": "#F2F0E5",
        "sideBarSectionHeader.foreground": "#100F0F",
        "sideBarSectionHeader.border": "#DAD8CE",
        "sideBar.activeBackground": "#CECDC3",
        "sideBar.activeForeground": "#100F0F",
        "sideBar.hoverBackground": "#DAD8CE",
        "sideBar.hoverForeground": "#6F6E69",
        "sideBar.folderIcon.foreground": "#66800B",
        "sideBar.fileIcon.foreground": "#205EA6",
        "list.warningForeground": "#BC5215",
        "list.errorForeground": "#AF3029",
        "list.inactiveSelectionBackground": "#DAD8CE",
        "list.activeSelectionBackground": "#CECDC3",
        "list.inactiveSelectionForeground": "#100F0F",
        "list.activeSelectionForeground": "#100F0F",
        "list.hoverForeground": "#100F0F",
        "list.hoverBackground": "#DAD8CE",
        "input.background": "#F2F0E5",
        "input.foreground": "#100F0F",
        "input.border": "#DAD8CE",
        "input.placeholderForeground": "#6F6E69",
        "inputOption.activeBorder": "#DAD8CE",
        "inputOption.activeBackground": "#E6E4D9",
        "inputOption.activeForeground": "#100F0F",
        "inputValidation.infoBackground": "#24837B",
        "inputValidation.infoBorder": "#3AA99F",
        "inputValidation.warningBackground": "#BC5215",
        "inputValidation.warningBorder": "#DA702C",
        "inputValidation.errorBackground": "#AF3029",
        "inputValidation.errorBorder": "#D14D41",
        "dropdown.background": "#F2F0E5",
        "dropdown.foreground": "#100F0F",
        "dropdown.border": "#DAD8CE",
        "dropdown.listBackground": "#FFFCF0",
        "badge.background": "#24837B",
        "activityBarBadge.background": "#24837B",
        "button.background": "#24837B",
        "button.foreground": "#FFFCF0",
        "badge.foreground": "#FFFCF0",
        "activityBarBadge.foreground": "#FFFCF0"
    },
    "rules": [
        {
            "foreground": "#100F0F",
            "token": "source"
        },
        {
            "foreground": "#100F0F",
            "token": "support.type.property-name.css"
        },
        {
            "foreground": "#BC5215",
            "token": "entity.name.type.class"
        },
        {
            "foreground": "#AD8301",
            "token": "entity.name.type.interface"
        },
        {
            "foreground": "#AD8301",
            "token": "entity.name.type"
        },
        {
            "foreground": "#BC5215",
            "token": "entity.name.type.struct"
        },
        {
            "foreground": "#BC5215",
            "token": "entity.name.type.enum"
        },
        {
            "foreground": "#BC5215",
            "token": "meta.object-literal.key"
        },
        {
            "foreground": "#BC5215",
            "token": "support.type.property-name"
        },
        {
            "foreground": "#66800B",
            "token": "entity.name.function.method"
        },
        {
            "foreground": "#66800B",
            "token": "meta.function.method"
        },
        {
            "foreground": "#BC5215",
            "fontStyle": "bold",
            "token": "entity.name.function"
        },
        {
            "foreground": "#BC5215",
            "fontStyle": "bold",
            "token": "support.function"
        },
        {
            "foreground": "#BC5215",
            "fontStyle": "bold",
            "token": "meta.function-call.generic"
        },
        {
            "foreground": "#100F0F",
            "token": "variable"
        },
        {
            "foreground": "#100F0F",
            "token": "meta.variable"
        },
        {
            "foreground": "#100F0F",
            "token": "variable.other.object.property"
        },
        {
            "foreground": "#66800B",
            "token": "variable.other.object"
        },
        {
            "foreground": "#66800B",
            "token": "variable.other.readwrite.alias"
        },
        {
            "foreground": "#A02F6F",
            "token": "variable.other.global"
        },
        {
            "foreground": "#A02F6F",
            "token": "variable.language.this"
        },
        {
            "foreground": "#E6E4D9",
            "token": "variable.other.local"
        },
        {
            "foreground": "#100F0F",
            "token": "variable.parameter"
        },
        {
            "foreground": "#100F0F",
            "token": "meta.parameter"
        },
        {
            "foreground": "#205EA6",
            "token": "variable.other.property"
        },
        {
            "foreground": "#205EA6",
            "token": "meta.property"
        },
        {
            "foreground": "#24837B",
            "token": "string"
        },
        {
            "foreground": "#24837B",
            "token": "string.other.link"
        },
        {
            "foreground": "#24837B",
            "token": "markup.inline.raw.string.markdown"
        },
        {
            "foreground": "#100F0F",
            "token": "constant.character.escape"
        },
        {
            "foreground": "#100F0F",
            "token": "constant.other.placeholder"
        },
        {
            "foreground": "#66800B",
            "token": "keyword"
        },
        {
            "foreground": "#AF3029",
            "token": "keyword.control.import"
        },
        {
            "foreground": "#AF3029",
            "token": "keyword.control.from"
        },
        {
            "foreground": "#AF3029",
            "token": "keyword.import"
        },
        {
            "foreground": "#205EA6",
            "token": "storage.modifier"
        },
        {
            "foreground": "#205EA6",
            "token": "keyword.modifier"
        },
        {
            "foreground": "#205EA6",
            "token": "storage.type"
        },
        {
            "foreground": "#6F6E69",
            "token": "comment"
        },
        {
            "foreground": "#6F6E69",
            "token": "punctuation.definition.comment"
        },
        {
            "foreground": "#B7B5AC",
            "token": "comment.documentation"
        },
        {
            "foreground": "#B7B5AC",
            "token": "comment.line.documentation"
        },
        {
            "foreground": "#5E409D",
            "token": "constant.numeric"
        },
        {
            "foreground": "#AD8301",
            "token": "constant.language.boolean"
        },
        {
            "foreground": "#AD8301",
            "token": "constant.language.json"
        },
        {
            "foreground": "#AF3029",
            "token": "keyword.operator"
        },
        {
            "foreground": "#205EA6",
            "token": "entity.name.function.preprocessor"
        },
        {
            "foreground": "#205EA6",
            "token": "meta.preprocessor"
        },
        {
            "foreground": "#A02F6F",
            "token": "meta.preprocessor"
        },
        {
            "foreground": "#205EA6",
            "token": "markup.underline.link"
        },
        {
            "foreground": "#205EA6",
            "token": "entity.name.tag"
        },
        {
            "foreground": "#A02F6F",
            "token": "support.class.component"
        },
        {
            "foreground": "#AD8301",
            "token": "entity.other.attribute-name"
        },
        {
            "foreground": "#AD8301",
            "token": "meta.attribute"
        },
        {
            "foreground": "#AD8301",
            "token": "support.type"
        },
        {
            "foreground": "#100F0F",
            "token": "variable.other.constant"
        },
        {
            "foreground": "#100F0F",
            "token": "variable.readonly"
        },
        {
            "foreground": "#A02F6F",
            "token": "entity.name.label"
        },
        {
            "foreground": "#A02F6F",
            "token": "punctuation.definition.label"
        },
        {
            "foreground": "#AD8301",
            "token": "entity.name.namespace"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.modifier.namespace"
        },
        {
            "foreground": "#AD8301",
            "token": "markup.bold.markdown"
        },
        {
            "foreground": "#AF3029",
            "token": "entity.name.module"
        },
        {
            "foreground": "#AF3029",
            "token": "storage.modifier.module"
        },
        {
            "foreground": "#BC5215",
            "token": "variable.type.parameter"
        },
        {
            "foreground": "#BC5215",
            "token": "variable.parameter.type"
        },
        {
            "foreground": "#A02F6F",
            "token": "keyword.control.exception"
        },
        {
            "foreground": "#A02F6F",
            "token": "keyword.control.trycatch"
        },
        {
            "foreground": "#AD8301",
            "token": "meta.decorator"
        },
        {
            "foreground": "#AD8301",
            "token": "punctuation.decorator"
        },
        {
            "foreground": "#AD8301",
            "token": "entity.name.function.decorator"
        },
        {
            "foreground": "#100F0F",
            "token": "variable.function"
        },
        {
            "foreground": "#6F6E69",
            "token": "punctuation"
        },
        {
            "foreground": "#6F6E69",
            "token": "punctuation.terminator"
        },
        {
            "foreground": "#6F6E69",
            "token": "punctuation.definition.tag"
        },
        {
            "foreground": "#6F6E69",
            "token": "punctuation.separator"
        },
        {
            "foreground": "#6F6E69",
            "token": "punctuation.definition.string"
        },
        {
            "foreground": "#6F6E69",
            "token": "punctuation.section.block"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.type.numeric.go"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.type.byte.go"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.type.boolean.go"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.type.string.go"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.type.uintptr.go"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.type.error.go"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.type.rune.go"
        },
        {
            "foreground": "#AD8301",
            "token": "constant.language.go"
        },
        {
            "foreground": "#AD8301",
            "token": "support.class.dart"
        },
        {
            "foreground": "#AD8301",
            "token": "keyword.other.documentation"
        },
        {
            "foreground": "#AD8301",
            "token": "storage.modifier.import.java"
        },
        {
            "foreground": "#AD8301",
            "token": "punctuation.definition.list.begin.markdown"
        },
        {
            "foreground": "#AD8301",
            "token": "punctuation.definition.quote.begin.markdown"
        },
        {
            "foreground": "#AD8301",
            "token": "meta.separator.markdown"
        },
        {
            "foreground": "#AD8301",
            "token": "entity.name.section.markdown"
        },
        {
            "foreground": "#24837B",
            "token": "markup.italic.markdown"
        },
        {
            "foreground": "#24837B",
            "token": "support.type.python"
        },
        {
            "foreground": "#24837B",
            "token": "variable.legacy.builtin.python"
        },
        {
            "foreground": "#24837B",
            "token": "support.constant.property-value.css"
        },
        {
            "foreground": "#24837B",
            "token": "storage.modifier.attribute.swift"
        },
        {
            "foreground": "#5E409D",
            "token": "keyword.channel.go"
        },
        {
            "foreground": "#5E409D",
            "token": "keyword.other.platform.os.swift"
        },
        {
            "foreground": "#A02F6F",
            "token": "punctuation.definition.heading.markdown"
        }
    ],
    "encodedTokensColors": []
};