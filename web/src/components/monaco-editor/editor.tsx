import Monaco from '@monaco-editor/react';
import { useRef, useEffect } from 'react';

// TODO: is there a better way to do this?
import * as constants from "./constants"

type EditorProps = {
    ref?: React.RefObject<null>
}

export function Editor({ ref }: EditorProps) {
    const editorRef = useRef(null);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const handleEditorDidMount = (editor: any, _monaco: any) => {
        editorRef.current = editor;
        if (ref) {
            ref.current = editor;
        }

        // ensure initial layout is correct
        editor.layout();
    };


    // applies theme to editor
    const handleEditorWillMount = (monaco: any) => {
        monaco.editor.defineTheme("flexoki", constants.flexokiTheme);
    };


    return (
        <div className="w-full h-full relative" ref={containerRef}>
            <Monaco
                className='absolute inset-0'
                theme="flexoki"
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