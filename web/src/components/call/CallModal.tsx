"use client";

import React, { useEffect, useRef } from "react";
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
        toggleVideo
    } = useCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
                <div className="flex-1 relative w-full h-full bg-muted flex items-center justify-center overflow-hidden">
                    {remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                            <UserAvatar avatarUrl={peer?.avatarUrl} size={128} className="w-32 h-32 mb-4 opacity-50" />
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
                                className="w-full h-full object-cover mirror"
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