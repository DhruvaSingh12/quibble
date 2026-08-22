"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCall } from "@/providers/CallProvider";
import { Button } from "@/components/ui/Button";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Loader2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export function CallModal() {
    const {
        callState,
        peer,
        isVideo,
        localStream,
        remoteStream,
        isMuted,
        isVideoEnabled,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        remoteVideoEnabled
    } = useCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (callState === "active") {
            setDuration(0);
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [callState]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callState]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callState]);

    if (callState === "idle") return null;

    if (callState === "ringing" || callState === "calling") {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="bg-card w-full max-w-sm rounded-3xl p-8 flex flex-col items-center shadow-2xl border border-border/50 animate-in zoom-in-95">
                    <UserAvatar avatarUrl={peer?.avatarUrl} size={128} className="w-32 h-32 mb-6 border-4 border-primary/20 shadow-xl" />

                    <h2 className="text-2xl font-bold mb-2">{peer?.displayName}</h2>
                    <p className="text-muted-foreground mb-8">
                        {callState === "calling" ? "Calling..." : `Incoming ${isVideo ? "Video" : "Audio"} Call...`}
                    </p>

                    <div className="flex gap-6 w-full justify-center">
                        {callState === "ringing" && (
                            <Button
                                onClick={acceptCall}
                                size="icon"
                                className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                            >
                                {isVideo ? <Video size={28} /> : <Phone size={28} />}
                            </Button>
                        )}
                        <Button
                            onClick={callState === "ringing" ? rejectCall : endCall}
                            size="icon"
                            className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                        >
                            <PhoneOff size={28} />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (callState === "active") {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col">
                {/* Remote Stream Background */}
                <div className="flex-1 relative w-full h-full bg-background flex flex-col items-center justify-center overflow-hidden">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={isVideo && remoteVideoEnabled ? "w-full h-full object-contain" : "hidden"}
                    />
                    
                    {(!isVideo || !remoteVideoEnabled) && (
                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                            <UserAvatar avatarUrl={peer?.avatarUrl} size={160} className="w-40 h-40 mb-6 shadow-2xl border-4 border-primary/20" />
                            <h2 className="text-3xl font-bold mb-2">{peer?.displayName}</h2>
                            {!isVideo && (
                                <p className="text-muted-foreground text-lg font-medium">
                                    {formatDuration(duration)}
                                </p>
                            )}
                        </div>
                    )}

                    {isVideo && (
                        <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white font-medium shadow-lg animate-in fade-in">
                            {formatDuration(duration)}
                        </div>
                    )}

                    {isVideo && !remoteStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-background/50 backdrop-blur-sm z-10">
                            <Loader2 className="animate-spin mb-4 w-8 h-8" />
                            <p>Connecting media...</p>
                        </div>
                    )}
                </div>

                {/* Local Stream Picture-in-Picture */}
                {isVideo && (
                    <div className="absolute top-6 right-6 w-32 h-48 md:w-48 md:h-64 bg-card rounded-2xl overflow-hidden shadow-2xl border-2 border-border z-10">
                        {localStream ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain mirror"
                                style={{ transform: "scaleX(-1)" }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                )}

                {/* Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 p-8 bg-linear-to-t from-background/90 to-transparent flex justify-center gap-6 z-10">
                    <Button
                        onClick={toggleMute}
                        size="icon"
                        variant="secondary"
                        className={`w-14 h-14 rounded-full ${isMuted ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-none'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </Button>

                    {isVideo && (
                        <Button
                            onClick={toggleVideo}
                            size="icon"
                            variant="secondary"
                            className={`w-14 h-14 rounded-full ${!isVideoEnabled ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-none'}`}
                        >
                            {!isVideoEnabled ? <VideoOff size={24} /> : <Video size={24} />}
                        </Button>
                    )}

                    <Button
                        onClick={endCall}
                        size="icon"
                        className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20 border-none"
                    >
                        <PhoneOff size={24} />
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}