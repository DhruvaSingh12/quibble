import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import UserAvatar from '../UserAvatar';
import { useCall, CallPeer } from '@/providers/CallProvider';

interface ChatHeaderProps {
    friend: {
        id: string;
        avatarUrl?: string;
        displayName: string;
        username: string;
    } | null;
    peerTyping: boolean;
    conversationId: string;
}

export function ChatHeader({ friend, peerTyping, conversationId }: ChatHeaderProps) {
    const { startCall } = useCall();
    
    if (!friend) return null;

    const handleCall = (isVideo: boolean) => {
        const peer: CallPeer = {
            id: friend.id,
            username: friend.username,
            displayName: friend.displayName,
            avatarUrl: friend.avatarUrl || null
        };
        startCall(conversationId, peer, isVideo);
    };

    return (
        <div className="flex items-center gap-3 p-3 border-b flex-none sticky top-0 bg-background/80 backdrop-blur-md z-10">
            <Button variant="ghost" size="icon" asChild className="md:hidden">
                <Link href="/messages"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <UserAvatar avatarUrl={friend.avatarUrl} size={42} />
            <div className="flex flex-col">
                <span className="font-bold leading-tight">{friend.displayName}</span>
                {peerTyping ? (
                    <span className="text-xs text-primary font-medium animate-pulse">Typing...</span>
                ) : (
                    <span className="text-xs text-muted-foreground">@{friend.username}</span>
                )}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full" onClick={() => handleCall(false)}>
                    <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-full" onClick={() => handleCall(true)}>
                    <Video className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}
