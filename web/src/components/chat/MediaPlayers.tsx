import React, { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

export function CustomVideoPlayer({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;
        if (total > 0) {
            setProgress((current / total) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const seekTo = (Number(e.target.value) / 100) * videoRef.current.duration;
        videoRef.current.currentTime = seekTo;
        setProgress(Number(e.target.value));
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return (
        <div
            className="group relative overflow-hidden flex items-center justify-center w-full h-full rounded-xl cursor-pointer"
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                playsInline
            />

            {/* Elegant Center Play Button Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none transition-opacity duration-300 ${isPlaying ? "opacity-0" : "opacity-100"}`}>
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                    <Play className="w-6 h-6 text-black fill-black" />
                </div>
            </div>

            {/* Sleek Bottom Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 h-16 ${isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"} transition-opacity`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute bottom-3 left-3 right-24 md:right-28 flex items-center gap-3 z-10">
                    <button onClick={togglePlay} className="text-white/90 hover:text-white transition-colors focus:outline-none drop-shadow-md">
                        {isPlaying ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4" fill="currentColor" />}
                    </button>

                    <div className="flex-1 relative flex items-center h-4 group/slider">
                        <div className="absolute left-0 right-0 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-75"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress || 0}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                        <div
                            className="absolute h-3 w-3 bg-white rounded-full shadow-md transform -translate-y-1/2 top-1/2 -ml-1.5 opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none"
                            style={{ left: `${progress}%` }}
                        />
                    </div>

                    <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors focus:outline-none drop-shadow-md">
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                </div>

                {/* Subtle gradient behind controls for readability */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent pointer-events-none z-0" />
            </div>
        </div>
    );
}

export function CustomAudioPlayer({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        if (total > 0) {
            setProgress((current / total) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const seekTo = (Number(e.target.value) / 100) * audioRef.current.duration;
        audioRef.current.currentTime = seekTo;
        setProgress(Number(e.target.value));
    };

    return (
        <div className="bg-background/80 backdrop-blur p-2 px-3 rounded-2xl flex items-center gap-3 shadow-sm border border-border/40 w-[240px] md:w-[280px]">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
            />

            <button
                onClick={togglePlay}
                className="w-10 h-10 flex-none bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md focus:outline-none"
            >
                {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-1" fill="currentColor" />}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1.5">
                <div className="w-full h-1.5 bg-muted rounded-full relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full pointer-events-none"
                        style={{ width: `${progress}%` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress || 0}
                        onChange={handleSeek}
                        className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}
