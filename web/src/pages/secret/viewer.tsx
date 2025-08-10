import { Header } from "@/components/page-header";
import { useLocation, useParams } from "react-router";
import { useSecret } from '@/hooks/api/use-secret'; // Adjust path
import { Loader, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"


function GetContent() {
    const { id = '' } = useParams<{ id: string }>(); // Default to '' for safety
    const { hash } = useLocation();
    const { content, error, isLoading } = useSecret(id, hash);

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    if (isLoading) {
        return <div><Loader /></div>; // Or use a spinner component
    }

    return <div>{content}</div>;
}

export function SecretViewerPage() {
    const { id = 'UNKNOWN' } = useParams<{ id: string }>();

    const breadcrumbs = [
        { label: "secret.lystic.dev", href: "/" },
        { label: id }
    ];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs}>
                <Button onClick={() => { toast("TODO") }} >
                    <Plus /> New
                </Button>
            </Header>
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 flex justify-center items-center w-full">
                    <GetContent />
                </div>
            </main>
        </>
    );
}