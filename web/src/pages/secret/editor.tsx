import { Header } from "@/components/page-header";

import { pushSecret } from "@/api/secret"
import { encryptSecret } from "@/lib/crypto"

import { Editor, type CodeEditor } from "@/components/monaco-editor/editor"
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function SecretEditorPage() {
    const breadcrumbs = [
        { label: "secret.lystic.dev" },
    ];

    // this ref holds the monaco editor so we can call functionality on it like `getValue()` to get the content
    const editor = useRef<CodeEditor>(null);

    const save = () => {
        const value = editor.current?.getValue();
        if (!value) {
            alert("ERROR");
            return;
        }

        const content = encryptSecret(value, "abc123");
        pushSecret(content).then((id) => {
            alert(id)
        }).catch((err) => {
            alert(err);
        });
    }

    return (
        <>
            <Header breadcrumbItems={breadcrumbs}>
                <Button onClick={save}>
                    <Save /> Save
                </Button>
            </Header >
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    <Editor ref={editor} />
                </div>
            </main>
        </>

    );
}