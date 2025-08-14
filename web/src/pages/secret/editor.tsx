import { Header } from "@/components/page-header";

import { pushSecret } from "@/api/secret"
import { encryptSecret } from "@/lib/crypto"

import { Editor, type CodeEditor } from "@/components/monaco-editor/editor"
import { toast } from "sonner"
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { LinkShareDialog } from "@/components/link-share-dialog";

export function SecretEditorPage() {
    const editor = useRef<CodeEditor>(null);
    const [shareUrl, setShareUrl] = useState("");
    const [open, setOpen] = useState(false);

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
                setShareUrl(`${window.location.origin}/s/${id}#${key}`);
                setOpen(true);
            })
            .catch((err: Error) => toast.error(err.message))
    }

    // TODO: ctrl+s

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

            {/* TODO:   probably we'll change this to a provider or something & have a `ShareLink(title, description, url)` 
                        that sets all these values and makes the dialog pop up... storing the state internally. IDK how to do this yet...
            */}
            <LinkShareDialog
                title="Share Your Secret"
                description="Your secret has been saved. Share this one-time URL with someone. The content will be deleted after the first view."
                url={shareUrl} open={open} onOpenChanged={setOpen}
            />
        </>

    );
}