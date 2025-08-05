import { Header } from "@/components/page-header";

import { pushSecret } from "@/api/secret"
import { encryptSecret } from "@/lib/crypto"

import { Editor, type CodeEditor } from "@/components/monaco-editor/editor"
import { useRef } from "react";

export function SecretEditorPage() {
    const breadcrumbs = [
        { label: "secret.lystic.dev" },
    ];

    // this ref holds the monaco editor so we can call functionality on it like `getValue()` to get the content
    const editor = useRef<CodeEditor>(null);

    const save = () => {
        const content = encryptSecret("test", "abc123");
        pushSecret(content).then((id) => {
            alert(id)
        });
    }

    return (
        // TODO: header needs optional button(s) i can define
        <Header breadcrumbItems={breadcrumbs}>
            <div className="flex-1 flex justify-center items-center w-full">
                <Editor ref={editor} />
            </div>
        </Header>
    );
}