import { useSubdomain } from "@/context/subdomain-provider"; // Adjust import path
import { SERVICE_ROUTERS } from "@/pages/domain-router";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

function labelFor(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

export function SubdomainSelector() {
    const { subdomain, setSubdomain } = useSubdomain();

    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) return null;


    return (
        <div className="flex items-center gap-2">
            <Label htmlFor="subdomain-select">Dev Subdomain:</Label>
            <Select value={subdomain} onValueChange={setSubdomain}>
                <SelectTrigger id="subdomain-select" className="w-[180px]">
                    <SelectValue placeholder="Select subdomain" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="main">Main</SelectItem>
                    {Object.keys(SERVICE_ROUTERS).map((name) => (
                        <SelectItem key={name} value={name}>{labelFor(name)}</SelectItem>
                    ))}
                    <SelectItem value="not-found">Not Found</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}