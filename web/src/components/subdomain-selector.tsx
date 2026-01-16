import { useSubdomain } from "@/context/subdomain-provider"; // Adjust import path

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFrontendTool } from "@copilotkit/react-core";

import { Label } from "@/components/ui/label";

export function SubdomainSelector() {
    const { subdomain, setSubdomain } = useSubdomain();

    useFrontendTool({
        name: "set_page",
        description:
            "Change the users page to the desired one.",
        parameters: [
            {
                name: "page",
                type: "string",
                description: "The page. Valid pages are: main, blog, secret, edit, upload, swap, not-found.",
            },
        ],
        handler: ({ page }) => {
            setSubdomain(page);
            return {
                status: "success",
                message: `Subdomain changed to ${subdomain}`,
            };
        }
    });

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
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="secret">Secret</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="upload">Upload</SelectItem>
                    <SelectItem value="swap">Swap</SelectItem>
                    <SelectItem value="not-found">Not Found</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}