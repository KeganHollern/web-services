import { Header } from "@/components/page-header";
import { PageMeta } from "@/components/page-meta";
import { useLocation, useNavigate, useParams } from "react-router";
import { useSecret } from '@/hooks/api/use-secret'; // Adjust path
import { Loader, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { Editor } from "@/components/monaco-editor/editor";
import { useEffect } from "react";

export function SecretViewerPage() {
    const { id = 'UNKNOWN' } = useParams<{ id: string }>();
    const { hash } = useLocation();
    const navigate = useNavigate();

    const { content, error, isLoading } = useSecret(id, hash);

    // Show toast if error changes from null
    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const breadcrumbs = [
        { label: "lystic.dev/secret", href: "/" },
        { label: id }
    ];

    return (
        <>
            <PageMeta
                title="View encrypted secret"
                description="Decrypt and view a one-time secret. Content is decrypted client-side using a key from the URL."
            />
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
                        <Editor readonly={true} content={content ?? ""} />
                    }
                </div>
            </main>
        </>
    );
}