import { Editor } from "@/components/monaco-editor/editor";
import { Header } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useLinkShare } from "@/context/linkshare-provider";
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
import { Link } from "lucide-react";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { useCallback, useEffect, useRef, useState } from "react";

function getDocIdFromHash(): string | null {
    const hash = window.location.hash;
    if (!hash || hash === "#") return null;
    return hash.slice(1);
}

function generateDocId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function EditPage() {
    const [docId, setDocId] = useState(getDocIdFromHash);
    const { shareLink } = useLinkShare();
    const collab = useCollaborativeEditor(docId);
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    useEffect(() => {
        if (!docId) {
            const id = generateDocId();
            window.location.hash = id;
            setDocId(id);
        }
    }, [docId]);

    useEffect(() => {
        const onHashChange = () => setDocId(getDocIdFromHash());
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const handleEditorMount = useCallback(
        (editorInstance: editor.IStandaloneCodeEditor, _monaco: Monaco) => {
            editorRef.current = editorInstance;
        },
        [],
    );

    useEffect(() => {
        if (!editorRef.current || !collab) return;
        const binding = new MonacoBinding(
            collab.ytext,
            editorRef.current.getModel()!,
            new Set([editorRef.current]),
            collab.awareness,
        );
        return () => binding.destroy();
    }, [collab]);

    const breadcrumbs = [{ label: "Editor" }];

    if (!docId) {
        return null;
    }

    return (
        <>
            <Header breadcrumbItems={breadcrumbs}>
                <Button
                    onClick={() =>
                        shareLink(
                            "Share Editor",
                            "Share this link to collaborate on this document.",
                            window.location.href,
                        )
                    }
                >
                    <Link /> Share
                </Button>
            </Header>
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    <Editor
                        content=""
                        language="markdown"
                        onEditorMount={handleEditorMount}
                    />
                </div>
            </main>
        </>
    );
}
