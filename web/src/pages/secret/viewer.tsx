import { Header } from "@/components/page-header";
import { useLocation, useNavigate, useParams } from "react-router";
import { useSecret } from '@/hooks/api/use-secret'; // Adjust path
import { Loader, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { Editor, type CodeEditor } from "@/components/monaco-editor/editor";
import { useEffect, useRef } from "react";

export function SecretViewerPage() {
    const { id = 'UNKNOWN' } = useParams<{ id: string }>();
    const { hash } = useLocation();
    const editor = useRef<CodeEditor>(null);
    const navigate = useNavigate();

    const { content, error, isLoading } = useSecret(id, hash);

    // Show toast if error changes from null
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const breadcrumbs = [
        { label: "secret.lystic.dev", href: "/" },
        { label: id }
    ];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs}>
                <Button onClick={() => {
                    navigate("/")
                }} >
                    <Plus /> New
                </Button>
            </Header>
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    {isLoading ?
                        <Loader />
                        :
                        <Editor ref={editor} readonly={true} content={content ?? ""} />
                    }
                </div>
            </main>
        </>
    );
}