export type SoundName = "jump" | "wallhit" | "explosion";

const FILES: Record<SoundName, string> = {
    jump: "/ping/sfx/jump.ogg",
    wallhit: "/ping/sfx/wallhit.ogg",
    explosion: "/ping/sfx/explosion.ogg",
};

let context: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const failed = new Set<SoundName>();

function getContext(): AudioContext | null {
    if (context) return context;
    const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    return context;
}

export async function preload(): Promise<void> {
    const ctx = getContext();
    if (!ctx) return;
    await Promise.all(
        (Object.keys(FILES) as SoundName[]).map(async (name) => {
            try {
                const res = await fetch(FILES[name]);
                if (!res.ok) throw new Error(`status ${res.status}`);
                const data = await res.arrayBuffer();
                const buf = await ctx.decodeAudioData(data);
                buffers.set(name, buf);
            } catch (err) {
                if (!failed.has(name)) {
                    failed.add(name);
                    console.warn(`[ping/audio] failed to load ${name}:`, err);
                }
            }
        }),
    );
}

export function resume(): void {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
        void ctx.resume();
    }
}

export function play(name: SoundName): void {
    const ctx = getContext();
    if (!ctx) return;
    const buf = buffers.get(name);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
}
