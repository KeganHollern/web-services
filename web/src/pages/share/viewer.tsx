import { Fullscreen, Home, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { fetchTurnConfig } from "@/api/turn";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { parseShareUrl } from "@/lib/share/crypto";
import { createViewerSession, type DataChannelHandle, type PeerSession } from "@/lib/share/rtc";
import { SignalingClient } from "@/lib/share/signaling";

import { CHAT_CHANNEL_LABEL, ChatPanel } from "./chat-panel";
import { BadLinkTitle, ShareEndedBody, ShareEndedTitle } from "./constants";
import { RelayPrompt } from "./relay-prompt";
import { SasConfirm } from "./sas-confirm";
import { computeSAS } from "./sas";
import { StatusPill, type ShareStatus, type Transport } from "./status-pill";
import { createWireBridge, type WireBridge } from "./wire";

type Phase =
    | "connecting"
    | "waiting-offer"
    | "verifying"
    | "live"
    | "ended"
    | "error";

interface ViewerPanelProps {
    hash: string;
}

export function ViewerPanel({ hash }: ViewerPanelProps) {
    const [phase, setPhase] = useState<Phase>("connecting");
    const [error, setError] = useState<string | null>(null);
    const [errorCanRetry, setErrorCanRetry] = useState(false);
    const [sas, setSas] = useState<string | null>(null);
    const [localConfirmed, setLocalConfirmed] = useState(false);
    const [remoteConfirmed, setRemoteConfirmed] = useState(false);
    const [chatChannel, setChatChannel] = useState<DataChannelHandle | null>(null);
    const [relayPromptOpen, setRelayPromptOpen] = useState(false);
    const [relayBusy, setRelayBusy] = useState(false);
    const [peerRelayRequested, setPeerRelayRequested] = useState(false);
    const [relayEnabled, setRelayEnabled] = useState(false);
    const [transport, setTransport] = useState<Transport>("unknown");

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const clientRef = useRef<SignalingClient | null>(null);
    const sessionRef = useRef<PeerSession | null>(null);
    const bridgeRef = useRef<WireBridge | null>(null);
    const sendConfirmRef = useRef<() => Promise<void>>(async () => { });

    useEffect(() => {
        let cancelled = false;
        let fingerprintTimer: number | null = null;
        let watchdogTimer: number | null = null;

        const clearTimers = () => {
            if (fingerprintTimer != null) {
                clearInterval(fingerprintTimer);
                fingerprintTimer = null;
            }
            if (watchdogTimer != null) {
                clearTimeout(watchdogTimer);
                watchdogTimer = null;
            }
        };

        const fail = (msg: string, canRetry = false) => {
            if (cancelled) return;
            clearTimers();
            setError(msg);
            setErrorCanRetry(canRetry);
            setPhase("error");
        };

        (async () => {
            let parsed;
            try {
                parsed = parseShareUrl(hash);
            } catch (err) {
                fail(err instanceof Error ? err.message : "invalid link");
                return;
            }
            if (cancelled) return;

            const client = new SignalingClient(parsed.key);
            clientRef.current = client;

            try {
                await client.connect(parsed.roomId);
            } catch {
                fail("Could not join room — it may not exist or may be full.");
                return;
            }
            if (cancelled) {
                client.close();
                return;
            }

            const bridge = createWireBridge(client);
            bridgeRef.current = bridge;
            sendConfirmRef.current = () => bridge.sendApp({ kind: "sas-confirmed" });

            client.on("error", (ev) => {
                if (ev.message === "decrypt failed") {
                    fail("Could not decrypt signaling — the link key may be wrong.");
                } else {
                    fail(ev.message);
                }
            });
            client.on("peer-left", () => {
                if (cancelled) return;
                setPhase((prev) => {
                    if (prev === "live" || prev === "verifying") return "ended";
                    setError("The sharer left before the session started.");
                    return "error";
                });
            });
            client.on("close", () => {
                if (cancelled) return;
                setPhase((prev) => (prev === "live" || prev === "verifying" ? "ended" : prev));
            });

            bridge.onAppMessage((msg) => {
                if (msg.kind === "sas-confirmed") setRemoteConfirmed(true);
                else if (msg.kind === "relay-enabled") {
                    setPeerRelayRequested(true);
                    setRelayPromptOpen(true);
                }
            });

            const session = createViewerSession({
                signaling: bridge.transport,
                onIceFail: () => {
                    if (cancelled) return;
                    setRelayPromptOpen(true);
                },
                onStream: (stream) => {
                    streamRef.current = stream;
                },
            });
            sessionRef.current = session;
            setPhase("waiting-offer");

            fingerprintTimer = window.setInterval(() => {
                const local = session.getLocalFingerprint();
                const remote = session.getRemoteFingerprint();
                if (local && remote) {
                    clearTimers();
                    void computeSAS(local, remote).then((code) => {
                        if (cancelled) return;
                        setSas(code);
                        setPhase((prev) => (prev === "waiting-offer" ? "verifying" : prev));
                    });
                }
            }, 100);

            watchdogTimer = window.setTimeout(() => {
                if (cancelled) return;
                if (session.getRemoteFingerprint() != null) return;
                fail(
                    "The share session did not start. Ask the sharer to try again or reload this page.",
                    true,
                );
            }, 30000);
        })();

        return () => {
            cancelled = true;
            clearTimers();
            sessionRef.current?.dispose();
            sessionRef.current = null;
            clientRef.current?.close();
            clientRef.current = null;
            bridgeRef.current = null;
            streamRef.current = null;
        };
    }, [hash]);

    // Poll the selected-candidate-pair type once negotiated or on relay toggles.
    useEffect(() => {
        if (phase !== "live" && phase !== "verifying") {
            setTransport("unknown");
            return;
        }
        let cancelled = false;
        const poll = async () => {
            const s = sessionRef.current;
            if (!s) return;
            const t = await s.getTransport();
            if (!cancelled && t) {
                setTransport(t);
                // ICE recovered — the relay prompt is no longer relevant.
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

    const confirmRelay = async () => {
        const s = sessionRef.current;
        const b = bridgeRef.current;
        if (!s || relayBusy) return;
        setRelayBusy(true);
        try {
            const cfg = await fetchTurnConfig();
            await s.enableRelay(cfg.iceServers);
            setRelayEnabled(true);
            if (b) void b.sendApp({ kind: "relay-enabled" });
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

    useEffect(() => {
        if (phase === "verifying" && localConfirmed && remoteConfirmed) {
            setPhase("live");
        }
    }, [phase, localConfirmed, remoteConfirmed]);

    useEffect(() => {
        if (phase === "live" && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [phase]);

    useEffect(() => {
        if (phase !== "live") return;
        const session = sessionRef.current;
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

    const confirmSas = () => {
        setLocalConfirmed(true);
        void sendConfirmRef.current();
    };

    const rejectSas = () => {
        sessionRef.current?.dispose();
        clientRef.current?.close();
        setError("Verification failed — codes did not match. Session aborted.");
        setPhase("error");
    };

    const goFullscreen = () => {
        const el = videoRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
            void document.exitFullscreen();
        } else {
            void el.requestFullscreen();
        }
    };

    if (phase === "error") {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{BadLinkTitle}</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {errorCanRetry && (
                        <Button
                            className="w-full"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    )}
                    <Button asChild variant={errorCanRetry ? "outline" : "default"} className="w-full">
                        <Link to="/">
                            <Home /> Back to share
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (phase === "ended") {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{ShareEndedTitle}</CardTitle>
                    <CardDescription>{ShareEndedBody}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link to="/">
                            <Home /> Start a new share
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const status: ShareStatus =
        phase === "live" ? "live" : phase === "verifying" ? "verifying" : "waiting";

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <CardTitle>Viewing shared screen</CardTitle>
                <CardDescription>
                    End-to-end encrypted. The server cannot see this stream.
                </CardDescription>
                <CardAction className="flex items-center gap-2">
                    {phase === "live" && <ChatPanel channel={chatChannel} />}
                    <StatusPill status={status} transport={transport} />
                </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
                {(phase === "connecting" || phase === "waiting-offer") && (
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Loader2 className="size-4 animate-spin" />
                        {phase === "connecting" ? "Connecting…" : "Waiting for sharer…"}
                    </div>
                )}

                {phase === "verifying" && (
                    <SasConfirm
                        code={sas}
                        localConfirmed={localConfirmed}
                        remoteConfirmed={remoteConfirmed}
                        onConfirm={confirmSas}
                        onReject={rejectSas}
                    />
                )}

                {phase === "live" && (
                    <>
                        <Alert>
                            <AlertTitle className="text-xs">Verified</AlertTitle>
                            <AlertDescription className="text-xs">
                                Code {sas} confirmed on both sides.
                            </AlertDescription>
                        </Alert>
                        <div className="group relative overflow-hidden rounded-md bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                controls
                                className="aspect-video w-full"
                            />
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={goFullscreen}
                                aria-label="Fullscreen"
                            >
                                <Fullscreen />
                            </Button>
                        </div>
                        <Separator />
                        <Button asChild variant="outline" className="w-full">
                            <Link to="/">
                                <Home /> Back to share
                            </Link>
                        </Button>
                    </>
                )}
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
