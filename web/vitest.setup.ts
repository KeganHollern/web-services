// Polyfill WebRTC globals in Node so the rtc library can run under Vitest.
import * as wrtc from "@roamhq/wrtc";

type Globals = typeof globalThis & {
    RTCPeerConnection: unknown;
    RTCSessionDescription: unknown;
    RTCIceCandidate: unknown;
    RTCDataChannel: unknown;
    MediaStream: unknown;
    MediaStreamTrack: unknown;
};

const g = globalThis as Globals;
g.RTCPeerConnection = wrtc.RTCPeerConnection;
g.RTCSessionDescription = wrtc.RTCSessionDescription;
g.RTCIceCandidate = wrtc.RTCIceCandidate;
g.RTCDataChannel = wrtc.RTCDataChannel;
g.MediaStream = wrtc.MediaStream;
g.MediaStreamTrack = wrtc.MediaStreamTrack;
