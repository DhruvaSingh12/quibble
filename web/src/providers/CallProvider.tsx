"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useSocket } from "./SocketProvider";

export type CallState = "idle" | "ringing" | "calling" | "active";

export interface CallPeer {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}

interface CallContextType {
    callState: CallState;
    currentConversationId: string | null;
    peer: CallPeer | null;
    isVideo: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isVideoEnabled: boolean;
    startCall: (conversationId: string, peer: CallPeer, isVideo: boolean) => void;
    acceptCall: () => void;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
    const socket = useSocket();
    
    const [callState, setCallState] = useState<CallState>("idle");
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [peer, setPeer] = useState<CallPeer | null>(null);
    const [isVideo, setIsVideo] = useState<boolean>(false);
    
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

    // Stop all media tracks
    const stopMediaTracks = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
    };

    // Initialize RTCPeerConnection
    const createPeerConnection = (conversationId: string) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" }
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit("call_signal", {
                    conversationId,
                    signal: { type: "candidate", candidate: event.candidate }
                });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };

        peerConnection.current = pc;
        return pc;
    };

    const cleanupCall = () => {
        stopMediaTracks();
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        setCallState("idle");
        setCurrentConversationId(null);
        setPeer(null);
        setIsVideo(false);
        setIsMuted(false);
        setIsVideoEnabled(true);
        iceCandidateQueue.current = [];
    };

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = (data: { conversationId: string, caller: CallPeer, isVideo: boolean }) => {
            if (callState !== "idle") {
                // Reject if already in a call
                socket.emit("call_reject", { conversationId: data.conversationId });
                return;
            }
            setCurrentConversationId(data.conversationId);
            setPeer(data.caller);
            setIsVideo(data.isVideo);
            setCallState("ringing");
        };

        const handleCallAccepted = async (data: { conversationId: string, peerId: string }) => {
            if (currentConversationId !== data.conversationId) return;
            setCallState("active");
            
            try {
                // Caller creates the offer
                const pc = peerConnection.current;
                if (!pc) return;
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("call_signal", {
                    conversationId: data.conversationId,
                    signal: offer
                });
            } catch (error) {
                console.error("Error creating offer", error);
            }
        };

        const handleCallRejected = (data: { conversationId: string }) => {
            if (currentConversationId !== data.conversationId) return;
            alert("Call was declined.");
            cleanupCall();
        };

        const handleCallEnded = (data: { conversationId: string }) => {
            if (currentConversationId !== data.conversationId) return;
            cleanupCall();
        };

        const handleCallSignal = async (data: { conversationId: string, signal: any, senderId: string }) => {
            if (currentConversationId !== data.conversationId) return;
            const pc = peerConnection.current;
            if (!pc) return;

            const { signal } = data;
            try {
                if (signal.type === "offer") {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    
                    while (iceCandidateQueue.current.length > 0) {
                        const candidate = iceCandidateQueue.current.shift();
                        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit("call_signal", {
                        conversationId: data.conversationId,
                        signal: answer
                    });
                } else if (signal.type === "answer") {
                    await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    
                    while (iceCandidateQueue.current.length > 0) {
                        const candidate = iceCandidateQueue.current.shift();
                        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                } else if (signal.type === "candidate") {
                    if (pc.remoteDescription && pc.remoteDescription.type) {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                    } else {
                        iceCandidateQueue.current.push(signal.candidate);
                    }
                }
            } catch (err) {
                console.error("Signal error", err);
            }
        };

        socket.on("call_incoming", handleIncomingCall);
        socket.on("call_accepted", handleCallAccepted);
        socket.on("call_rejected", handleCallRejected);
        socket.on("call_ended", handleCallEnded);
        socket.on("call_signal", handleCallSignal);

        return () => {
            socket.off("call_incoming", handleIncomingCall);
            socket.off("call_accepted", handleCallAccepted);
            socket.off("call_rejected", handleCallRejected);
            socket.off("call_ended", handleCallEnded);
            socket.off("call_signal", handleCallSignal);
        };
    }, [socket, callState, currentConversationId]);

    // Actions
    const startCall = async (conversationId: string, targetPeer: CallPeer, video: boolean) => {
        if (!socket) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
            setLocalStream(stream);
            setIsVideo(video);
            setPeer(targetPeer);
            setCurrentConversationId(conversationId);
            setCallState("calling");
            setIsVideoEnabled(video);
            setIsMuted(false);

            const pc = createPeerConnection(conversationId);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            socket.emit("call_initiate", { conversationId, isVideo: video });
        } catch (err) {
            console.error("Media access error", err);
            alert("Could not access camera/microphone.");
        }
    };

    const acceptCall = async () => {
        if (!socket || !currentConversationId) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
            setLocalStream(stream);
            setIsVideoEnabled(isVideo);
            setIsMuted(false);

            const pc = createPeerConnection(currentConversationId);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            setCallState("active");
            socket.emit("call_accept", { conversationId: currentConversationId });
        } catch (err) {
            console.error("Media access error", err);
            alert("Could not access camera/microphone.");
            rejectCall();
        }
    };

    const rejectCall = () => {
        if (!socket || !currentConversationId) return;
        socket.emit("call_reject", { conversationId: currentConversationId });
        cleanupCall();
    };

    const endCall = () => {
        if (!socket || !currentConversationId) return;
        socket.emit("call_end", { conversationId: currentConversationId });
        cleanupCall();
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !audioTracks[0].enabled;
                setIsMuted(!audioTracks[0].enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            if (videoTracks.length > 0) {
                videoTracks[0].enabled = !videoTracks[0].enabled;
                setIsVideoEnabled(videoTracks[0].enabled);
            }
        }
    };

    return (
        <CallContext.Provider value={{
            callState,
            currentConversationId,
            peer,
            isVideo,
            localStream,
            remoteStream,
            isMuted,
            isVideoEnabled,
            startCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            toggleVideo
        }}>
            {children}
        </CallContext.Provider>
    );
}

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error("useCall must be used within CallProvider");
    }
    return context;
};
