import { encodeQR } from "qr";
import { useMemo } from "react";

import { cn } from "@/lib/utils";

interface QRCodeProps {
    value: string;
    className?: string;
}

export function QRCode({ value, className }: QRCodeProps) {
    const svg = useMemo(() => encodeQR(value, "svg"), [value]);
    return (
        <div
            aria-label="QR code"
            className={cn(
                "rounded-md bg-white p-3 [&>svg]:h-full [&>svg]:w-full [&>svg]:block",
                className,
            )}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
