import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function collabDebug(...args: unknown[]) {
    if (typeof window !== 'undefined' && localStorage.getItem('debug-collab') === 'true') {
        console.debug('[collab]', ...args);
    }
}

const CURSOR_COLORS = [
    '#e34234', // red
    '#3b82f6', // blue
    '#22c55e', // green
    '#f59e0b', // amber
    '#a855f7', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
];

const ANONYMOUS_NAMES = [
    'Curious Fox', 'Brave Owl', 'Swift Falcon', 'Gentle Deer',
    'Clever Otter', 'Bold Eagle', 'Calm Turtle', 'Quick Hare',
    'Wise Raven', 'Kind Dolphin',
];

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function buildWsUrl(_docId: string): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/api/editor/ws`;
}

export interface CollaborativeEditor {
    ydoc: Y.Doc;
    provider: WebsocketProvider;
    ytext: Y.Text;
    awareness: WebsocketProvider['awareness'];
    status: 'connecting' | 'connected' | 'disconnected';
    lastUpdate: Date | null;
}

export function useCollaborativeEditor(docId: string | null): CollaborativeEditor | null {
    const [result, setResult] = useState<CollaborativeEditor | null>(null);
    const [status, setStatus] = useState<CollaborativeEditor['status']>('connecting');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!docId) return;

        setStatus('connecting');
        setLastUpdate(null);

        const ydoc = new Y.Doc();
        const wsUrl = buildWsUrl(docId);
        const provider = new WebsocketProvider(wsUrl, docId, ydoc);
        // Increase reconnect timeout from default 30s to 120s. The browser
        // WebSocket API doesn't surface server-side pings (54s interval),
        // so the default causes spurious reconnects.
        (provider as any).messageReconnectTimeout = 120000;
        const ytext = ydoc.getText('content');

        collabDebug('Y.Doc created', { docId, clientID: ydoc.clientID });

        const color = randomFrom(CURSOR_COLORS);
        const name = randomFrom(ANONYMOUS_NAMES);

        provider.on('status', ({ status: s }: { status: string }) => {
            collabDebug('provider status', { docId, status: s });
            setStatus(s as CollaborativeEditor['status']);
            if (s === 'connected') {
                // Defer awareness update so it never fires during a Y.js model
                // content change, which would trigger MonacoBinding._rerenderDecorations
                // recursively inside deltaDecorations and throw.
                queueMicrotask(() => {
                    provider.awareness.setLocalStateField('user', { name, color });
                });
            }
        });

        provider.on('sync', (synced: boolean) => {
            collabDebug('provider sync', { docId, synced });
        });

        provider.on('connection-close', (event: CloseEvent | null, _provider: WebsocketProvider) => {
            collabDebug('provider connection-close', { docId, code: event?.code, reason: event?.reason });
        });

        provider.on('connection-error', (event: Event, _provider: WebsocketProvider) => {
            collabDebug('provider connection-error', { docId, event });
        });

        ydoc.on('update', () => {
            setLastUpdate(new Date());
        });

        // Set awareness state immediately too in case already connected
        provider.awareness.setLocalStateField('user', { name, color });
        collabDebug('awareness local state set', { docId, name, color });

        setResult({ ydoc, provider, ytext, awareness: provider.awareness, status: 'connecting', lastUpdate: null });

        cleanupRef.current = () => {
            provider.disconnect();
            ydoc.destroy();
        };

        return () => {
            collabDebug('Y.Doc destroying', { docId, clientID: ydoc.clientID });
            provider.disconnect();
            ydoc.destroy();
            setResult(null);
        };
    }, [docId]);

    // Mutate in place so the returned object is referentially stable.
    // Components that need status/lastUpdate read them from the hook's
    // separate state; the binding effect only depends on ytext/awareness.
    if (result) {
        result.status = status;
        result.lastUpdate = lastUpdate;
    }

    return result;
}
