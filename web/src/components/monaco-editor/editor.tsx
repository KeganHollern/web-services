import Monaco from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

import type { editor } from 'monaco-editor';
// TODO: is there better way to do this?
import * as constants from "./constants";
import { DarkTheme, LightTheme, SystemTheme, useTheme } from '@/context/theme-provider';

export type CodeEditor = editor.IStandaloneCodeEditor | null;

type EditorProps = {
    ref?: React.RefObject<CodeEditor>
}

export function Editor({ ref }: EditorProps) {
    const editorRef = useRef<CodeEditor>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    // these two functions to ensure editor shrinks with browser
    useEffect(() => {
        if (!containerRef.current || !editorRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (editorRef.current) {
                // @ts-ignore - we know editor exists
                editorRef.current.layout();
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, _monaco: any) => {
        editorRef.current = editor;
        if (ref) {
            ref.current = editor;
        }

        // ensure initial layout is correct
        editor.layout();
    };


    // applies theme to editor
    const handleEditorWillMount = (monaco: any) => {
        // TODO: create flexoki LIGHT theme
        // TODO use themeprovider ENUM for theme name hesre
        monaco.editor.defineTheme(DarkTheme, constants.flexokiThemeDark);
        monaco.editor.defineTheme(LightTheme, constants.flexokiThemeLight);

        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? constants.flexokiThemeDark
            : constants.flexokiThemeLight // TODO: change this to the light theme !

        monaco.editor.defineTheme(SystemTheme, systemTheme);

    };


    // TODO: change theme on theme selector changing
    return (
        <div className="w-full h-full relative" ref={containerRef}>
            <Monaco
                className='absolute inset-0'
                theme={theme}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                defaultLanguage="markdown"
                options={{
                    minimap: { enabled: false },
                    fontFamily: '"Google Sans Code", monospace',
                    fontSize: 16,
                    wordWrap: "on",
                    padding: { top: 16 },
                    lineNumbers: "on",
                    automaticLayout: true,
                }}
                defaultValue={constants.DEFAULT_CONTENT} />
        </div >
    );
};