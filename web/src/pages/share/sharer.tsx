import { useEffect, useRef, useState } from "react";
import { Copy, Loader2, MonitorUp, Square } from "lucide-react";
import { toast } from "sonner";

import { fetchTurnConfig } from "@/api/turn";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { encodeShareUrl, generateRoomKey } from "@/lib/share/crypto";
import { createSharerSession, type DataChannelHandle, type PeerSession } from "@/lib/share/rtc";
import { SignalingClient, createRoom } from "@/lib/share/signaling";

import { CHAT_CHANNEL_LABEL, ChatPanel } from "./chat-panel";
import { ExplainerBody, ExplainerTitle } from "./constants";
import { QRCode } from "./qr-code";
import { RelayPrompt } from "./relay-prompt";
import { SasConfirm } from "./sas-confirm";
import { computeSAS } from "./sas";
import { StatusPill, type ShareStatus, type Transport } from "./status-pill";
import { createWireBridge, type WireBridge } from "./wire";

type Phase = "idle" | "creating" | "created" | "verifying" | "live" | "disconnected";

interface ActiveRefs {
    client: SignalingClient;
    bridge: WireBridge;
    session: PeerSession | null;
    localStream: MediaStream | null;
    fingerprintTimer: number | null;
}

export function SharerPanel() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sas, setSas] = useState<string | null>(null);
    const [localConfirmed, setLocalConfirmed] = useState(false);
    const [remoteConfirmed, setRemoteConfirmed] = useState(false);
    const [chatChannel, setChatChannel] = useState<DataChannelHandle | null>(null);
    const [relayPromptOpen, setRelayPromptOpen] = useState(false);
    const [relayBusy, setRelayBusy] = useState(false);
    const [peerRelayRequested, setPeerRelayRequested] = useState(false);
    const [relayEnabled, setRelayEnabled] = useState(false);
    const [transport, setTransport] = useState<Transport>("unknown");

    const active = useRef<ActiveRefs | null>(null);
    const previewRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        return () => teardown();
    }, []);

    useEffect(() => {
        if (phase === "live" && previewRef.current && active.current?.localStream) {
            previewRef.current.srcObject = active.current.localStream;
        }
    }, [phase]);

    useEffect(() => {
        if (phase !== "live") return;
        const session = active.current?.session;
        if (!session) return;
        let disposed = false;
        let handle: DataChannelHandle | null = null;
        void session
            .openDataChannel(CHAT_CHANNEL_LABEL)
            .then((h) => {
                if (disposed) {
                    h.close();
                    return;
                }
                handle = h;
                setChatChannel(h);
            })
            .catch(() => {
                /* channel never opened */
            });
        return () => {
            disposed = true;
            handle?.close();
            setChatChannel(null);
        };
    }, [phase]);

    const teardown = () => {
        const a = active.current;
        if (!a) return;
        active.current = null;
        if (a.fingerprintTimer != null) clearInterval(a.fingerprintTimer);
        a.session?.dispose();
        a.localStream?.getTracks().forEach((t) => t.stop());
        a.client.close();
    };

    const stopShare = () => {
        teardown();
        setPhase("idle");
        setShareUrl(null);
        setSas(null);
        setLocalConfirmed(false);
        setRemoteConfirmed(false);
        setRelayPromptOpen(false);
        setRelayBusy(false);
        setPeerRelayRequested(false);
        setRelayEnabled(false);
        setTransport("unknown");
    };

    const startShare = async () => {
        setPhase("creating");
        try {
            const key = generateRoomKey();
            const roomId = await createRoom();
            const url = `${window.location.origin}/${encodeShareUrl(roomId, key)}`;
            setShareUrl(url);

            const client = new SignalingClient(key);
            await client.connect(roomId);
            const bridge = createWireBridge(client);

            active.current = {
                client,
                bridge,
                session: null,
                localStream: null,
                fingerprintTimer: null,
            };

            client.on("peer-joined", () => {
                void onPeerJoined();
            });
            client.on("peer-left", () => {
                setPhase("disconnected");
            });
            client.on("error", (ev) => {
                toast.error(ev.message);
            });
            client.on("close", () => {
                if (phase !== "idle") setPhase("disconnected");
            });

            bridge.onAppMessage((msg) => {
                if (msg.kind === "sas-confirmed") setRemoteConfirmed(true);
                else if (msg.kind === "relay-enabled") {
                    setPeerRelayRequested(true);
                    setRelayPromptOpen(true);
                }
            });

            setPhase("created");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "failed to create room");
            stopShare();
        }
    };

    const onPeerJoined = async () => {
        const a = active.current;
        if (!a) return;
        setPhase("verifying");

        try {
            const session = createSharerSession({
                signaling: a.bridge.transport,
                onIceFail: () => {
                    if (!active.current) return;
                    setRelayPromptOpen(true);
                },
                getMedia: async () => {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: false,
                    } as DisplayMediaStreamOptions);
                    if (!active.current) {
                        stream.getTracks().forEach((t) => t.stop());
                        return null;
                    }
                    active.current.localStream = stream;
                    stream.getVideoTracks()[0]?.addEventListener("ended", () => stopShare());
                    return stream;
                },
            });
            a.session = session;

            a.fingerprintTimer = window.setInterval(() => {
                const local = session.getLocalFingerprint();
                const remote = session.getRemoteFingerprint();
                if (local && remote) {
                    if (active.current?.fingerprintTimer != null) {
                        clearInterval(active.current.fingerprintTimer);
                        active.current.fingerprintTimer = null;
                    }
                    void computeSAS(local, remote).then(setSas);
                }
            }, 100);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "failed to start sharing");
            stopShare();
        }
    };

    const confirmSas = () => {
        const a = active.current;
        if (!a) return;
        setLocalConfirmed(true);
        void a.bridge.sendApp({ kind: "sas-confirmed" });
    };

    const confirmRelay = async () => {
        const a = active.current;
        if (!a?.session || relayBusy) return;
        setRelayBusy(true);
        try {
            const cfg = await fetchTurnConfig();
            await a.session.enableRelay(cfg.iceServers);
            setRelayEnabled(true);
            void a.bridge.sendApp({ kind: "relay-enabled" });
            setRelayPromptOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "failed to enable relay");
        } finally {
            setRelayBusy(false);
        }
    };

    const cancelRelay = () => {
        setRelayPromptOpen(false);
        setPeerRelayRequested(false);
    };

    // Poll the selected-candidate-pair type once we're live or on relay changes.
    useEffect(() => {
        if (phase !== "live" && phase !== "verifying") {
            setTransport("unknown");
            return;
        }
        let cancelled = false;
        const poll = async () => {
            const a = active.current;
            if (!a?.session) return;
            const t = await a.session.getTransport();
            if (!cancelled && t) {
                setTransport(t);
                // ICE recovered — the relay prompt is now stale.
                setRelayPromptOpen(false);
            }
        };
        void poll();
        const id = window.setInterval(poll, 3000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [phase, relayEnabled]);

    useEffect(() => {
        if (phase === "verifying" && localConfirmed && remoteConfirmed) {
            setPhase("live");
        }
    }, [phase, localConfirmed, remoteConfirmed]);

    const copyLink = async () => {
        if (!shareUrl) return;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied");
    };

    const status: ShareStatus =
        phase === "created"
            ? "waiting"
            : phase === "verifying"
                ? "verifying"
                : phase === "live"
                    ? "live"
                    : phase === "disconnected"
                        ? "disconnected"
                        : "waiting";

    if (phase === "idle" || phase === "creating") {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{ExplainerTitle}</CardTitle>
                    <CardDescription>{ExplainerBody}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={startShare} disabled={phase === "creating"}>
                        {phase === "creating" ? <Loader2 className="animate-spin" /> : <MonitorUp />}
                        Start screen share
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-xl">
            <CardHeader>
                <CardTitle>Screen share</CardTitle>
                <CardDescription>
                    Share the link below. Keep this tab open for the duration of the session.
                </CardDescription>
                <CardAction className="flex items-center gap-2">
                    {phase === "live" && <ChatPanel channel={chatChannel} />}
                    <StatusPill status={status} transport={transport} />
                </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
                {shareUrl && (
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                        <QRCode value={shareUrl} className="w-40 shrink-0" />
                        <div className="flex w-full flex-col gap-2">
                            <label className="text-muted-foreground text-xs">Share link</label>
                            <div className="flex gap-2">
                                <Input readOnly value={shareUrl} className="font-mono text-xs" />
                                <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copy link">
                                    <Copy />
                                </Button>
                            </div>
                            <p className="text-muted-foreground text-xs">
                                The key after the <code>#</code> never leaves your browser.
                            </p>
                        </div>
                    </div>
                )}

                {phase === "verifying" && (
                    <>
                        <Separator />
                        <SasConfirm
                            code={sas}
                            localConfirmed={localConfirmed}
                            remoteConfirmed={remoteConfirmed}
                            onConfirm={confirmSas}
                            onReject={stopShare}
                        />
                    </>
                )}

                {phase === "live" && (
                    <>
                        <Separator />
                        <div className="bg-muted overflow-hidden rounded-md">
                            <video
                                ref={previewRef}
                                autoPlay
                                playsInline
                                muted
                                className="aspect-video w-full"
                            />
                        </div>
                    </>
                )}

                {phase === "disconnected" && (
                    <>
                        <Separator />
                        <p className="text-muted-foreground text-sm">
                            The other side disconnected. Start a new share to continue.
                        </p>
                    </>
                )}

                <Button
                    className="w-full"
                    variant="destructive"
                    size="lg"
                    onClick={stopShare}
                >
                    <Square /> Stop share
                </Button>
            </CardContent>
            <RelayPrompt
                open={relayPromptOpen}
                busy={relayBusy}
                peerRequested={peerRelayRequested}
                onConfirm={() => void confirmRelay()}
                onCancel={cancelRelay}
            />
        </Card>
    );
}
