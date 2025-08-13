import { Header } from "@/components/page-header";

import { pushSecret } from "@/api/secret"
import { encryptSecret } from "@/lib/crypto"

import { Editor, type CodeEditor } from "@/components/monaco-editor/editor"
import { toast } from "sonner"
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function SecretEditorPage() {
    const editor = useRef<CodeEditor>(null);

    const breadcrumbs = [
        { label: "secret.lystic.dev" },
    ];

    // this ref holds the monaco editor so we can call functionality on it like `getValue()` to get the content

    const save = () => {
        const value = editor.current?.getValue();
        if (!value) {
            toast.error("no editor content");
            return;
        }

        // generate random key use web crypto
        // https://stackoverflow.com/questions/60738424/javascript-generate-random-hexadecimal (lol)
        const key = [...crypto.getRandomValues(new Uint8Array(20))].map(m => ('0' + m.toString(16)).slice(-2)).join('');

        encryptSecret(value, key)
            .then(encrypted => pushSecret(encrypted))
            .then(id => {
                toast.success(id);
                // TEMPORARY UNTIL POPUP
                navigator.clipboard.writeText(`${id}#${key}`);
            })
            .catch((err: Error) => toast.error(err.message))
    }

    // TODO: ctrl+s
    // TODO: add popup for 

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