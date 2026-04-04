import { Editor } from "@/components/monaco-editor/editor";
import { Header } from "@/components/page-header";
import { useEffect, useState } from "react";

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

    const breadcrumbs = [{ label: "Editor" }];

    if (!docId) {
        return null;
    }

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    <Editor content="" language="markdown" />
                </div>
            </main>
        </>
    );
}
