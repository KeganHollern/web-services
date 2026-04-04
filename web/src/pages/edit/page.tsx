import { Editor } from "@/components/monaco-editor/editor";
import { Header } from "@/components/page-header";
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { useCallback, useEffect, useState } from "react";

function getDocIdFromHash(): string | null {
    const hash = window.location.hash;
    if (!hash || hash === "#") return null;
    return hash.slice(1);
}

export function EditPage() {
    const [docId, setDocId] = useState(getDocIdFromHash);
    const [monacoEditor, setMonacoEditor] = useState<editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        const onHashChange = () => setDocId(getDocIdFromHash());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const collab = useCollaborativeEditor(docId);

    // Bind when both editor and collab are ready
    useEffect(() => {
        if (!collab || !monacoEditor) return;

        const model = monacoEditor.getModel();
        if (!model) return;

        const binding = new MonacoBinding(
            collab.ytext,
            model,
            new Set([monacoEditor]),
            collab.awareness,
        );

        return () => {
            binding.destroy();
        };
    }, [collab, monacoEditor]);

    const handleEditorMount = useCallback(
        (editor: editor.IStandaloneCodeEditor, _monaco: Monaco) => {
            setMonacoEditor(editor);
        },
        [],
    );

    const breadcrumbs = [{ label: "edit.lystic.dev" }];

    if (!docId) {
        return (
            <>
                <Header breadcrumbItems={breadcrumbs} />
                <main className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 flex justify-center items-center w-full text-muted-foreground">
                        No document ID — add a #docId to the URL
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <Editor
                    content=""
                    language="markdown"
                    onEditorMount={handleEditorMount}
                />
            </main>
        </>
    );
}
