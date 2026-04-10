import { cn } from "@/lib/utils";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function VideoPlayer({ src, className, ...props }: React.VideoHTMLAttributes<HTMLVideoElement>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-play/pause on scroll via Intersection Observer
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Sync playing state with video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  // Auto-hide controls after inactivity
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
    scheduleHide();
  }, [scheduleHide]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/video relative my-6 overflow-hidden rounded-lg border-2 border-muted shadow-sm",
        className
      )}
      onMouseMove={scheduleHide}
      onMouseLeave={() => {
        if (!videoRef.current?.paused) setShowControls(false);
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        className="w-full block"
        onClick={togglePlay}
        {...props}
      />

      {/* Play/pause center overlay — shown when paused */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity cursor-pointer"
          aria-label="Play video"
        >
          <div className="rounded-full bg-background/90 p-4 shadow-lg backdrop-blur-sm border border-muted">
            <Play className="size-8 text-foreground fill-foreground" />
          </div>
        </button>
      )}

      {/* Bottom control bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300",
          showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Play/pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="shrink-0 rounded-md p-1.5 text-white/90 hover:text-white transition-colors cursor-pointer"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing
            ? <Pause className="size-4 fill-current" />
            : <Play className="size-4 fill-current" />}
        </button>

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer group/bar"
          onClick={seek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/90 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Scrubber handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full bg-white shadow-sm opacity-0 group-hover/bar:opacity-100 transition-opacity"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Mute/unmute */}
        <button
          type="button"
          onClick={toggleMute}
          className="shrink-0 rounded-md p-1.5 text-white/90 hover:text-white transition-colors cursor-pointer"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted
            ? <VolumeX className="size-4" />
            : <Volume2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}
