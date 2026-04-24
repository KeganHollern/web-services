import { useEffect, useRef } from "react";

export function PingPage() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const cssWidth = window.innerWidth;
            const cssHeight = window.innerHeight;
            canvas.width = Math.round(cssWidth * dpr);
            canvas.height = Math.round(cssHeight * dpr);
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, cssWidth, cssHeight);
        };

        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("orientationchange", resize);
        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("orientationchange", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100vw", height: "100vh", background: "#000" }}
        />
    );
}
