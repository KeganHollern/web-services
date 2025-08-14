import { DarkTheme, LightTheme, SystemTheme, useTheme } from '@/context/theme-provider';
import { Editor as MonacoEditor, type Monaco } from '@monaco-editor/react';
import { Loader } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { useEffect, useRef } from 'react';
import * as constants from "./constants";


export type CodeEditor = editor.IStandaloneCodeEditor | null;

type EditorProps = {
    ref?: React.RefObject<CodeEditor>
    readonly?: boolean
    content?: string
    onSave?(): void
}

export function Editor({ ref, readonly = false, content = constants.DEFAULT_CONTENT, onSave }: EditorProps) {
    const editorRef = useRef<CodeEditor>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    // these two functions to ensure editor shrinks with browser
    useEffect(() => {
        if (!containerRef.current || !editorRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, _monaco: Monaco) => {
        editorRef.current = editor;
        if (ref) {
            ref.current = editor;
        }

        if (onSave) {
            editor.addCommand(_monaco.KeyMod.CtrlCmd | _monaco.KeyCode.KeyS, onSave)
        }

        // ensure initial layout is correct
        editor.layout();
    };


    // applies theme to editor
    const handleEditorWillMount = (monaco: Monaco) => {
        monaco.editor.defineTheme(DarkTheme, constants.flexokiThemeDark);
        monaco.editor.defineTheme(LightTheme, constants.flexokiThemeLight);

        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
            .matches
            ? constants.flexokiThemeDark
            : constants.flexokiThemeLight

        monaco.editor.defineTheme(SystemTheme, systemTheme);
    };

    return (
        <div className="w-full h-full relative" ref={containerRef}>
            <MonacoEditor
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
                    readOnly: readonly,
                }}
                loading={<Loader />}
                defaultValue={content} />
        </div >
    );
};