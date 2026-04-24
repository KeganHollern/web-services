export function attachInput(
    canvas: HTMLCanvasElement,
    onJump: () => void,
    onBack: () => void,
): () => void {
    const handlePointer = (e: PointerEvent) => {
        e.preventDefault();
        onJump();
    };
    const handleKey = (e: KeyboardEvent) => {
        if (e.code === "Space") {
            e.preventDefault();
            onJump();
        } else if (e.code === "Escape") {
            onBack();
        }
    };

    canvas.addEventListener("pointerdown", handlePointer);
    window.addEventListener("keydown", handleKey);

    return () => {
        canvas.removeEventListener("pointerdown", handlePointer);
        window.removeEventListener("keydown", handleKey);
    };
}
