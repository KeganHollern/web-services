import { uploadFile } from "@/api/upload";
import { Header } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function generateRandomName() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + '.png';
}

export function UploadPage() {
    const [password, setPassword] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedPassword = localStorage.getItem('uploadPassword');
        if (savedPassword) {
            setPassword(savedPassword);
        }
    }, []);

    const breadcrumbs = [
        { label: "upload.lystic.dev" },
    ];

    const submitUpload = async (password: string, file: File | null, showError: boolean = true) => {
        if (!password || !file) {
            if (showError) {
                toast.error("Please provide password and select a file.");
            }
            return false;
        }
        setUploading(true);
        try {
            const result = await uploadFile(password, file);
            toast.success(result.message);
            localStorage.setItem('uploadPassword', password);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Upload failed: unknown error");
            }
        } finally {
            setUploading(false);
        }
    }; const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitUpload(password, file);
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const randomName = generateRandomName();
                        const file = new File([blob], randomName, { type: blob.type });
                        setFile(file);
                        if (fileInputRef.current) {
                            const dt = new DataTransfer();
                            dt.items.add(file);
                            fileInputRef.current.files = dt.files;
                        }
                        toast.success(`Image pasted from clipboard as ${randomName}.`);
                        if (password) {
                            await submitUpload(password, file, false);
                        }
                        break;
                    }
                }
            }
        }
    };

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden" onPaste={handlePaste}>
                <div className="flex-1 flex justify-center items-center w-full p-4">
                    <Card className="w-full max-w-md relative">
                        <CardHeader>
                            <CardTitle>Upload File</CardTitle>
                            <CardDescription>
                                Enter the password and select a file to upload.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid w-full max-w-sm items-center gap-3">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        required
                                        disabled={uploading}
                                    />
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-3">
                                    <Label htmlFor="file">File</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                        disabled={uploading}
                                    />
                                </div>
                                <Button type="submit" disabled={uploading} className="w-full">
                                    {uploading ? "Uploading..." : "Upload"}
                                </Button>
                            </form>
                        </CardContent>
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </>
    );
}