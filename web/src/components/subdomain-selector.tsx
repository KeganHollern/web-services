import { useSubdomain } from "@/context/subdomain-provider"; // Adjust import path

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

export function SubdomainSelector() {
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) return null;

    const { subdomain, setSubdomain } = useSubdomain();

    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="subdomain-select">Dev Subdomain:</Label>
            <Select value={subdomain} onValueChange={setSubdomain}>
                <SelectTrigger id="subdomain-select" className="w-[180px]">
                    <SelectValue placeholder="Select subdomain" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="not-found">Not Found</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}