import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import UserAvatar from '../UserAvatar';

interface ChatHeaderProps {
    friend: {
        avatarUrl?: string;
        displayName: string;
        username: string;
    } | null;
    peerTyping: boolean;
}

export function ChatHeader({ friend, peerTyping }: ChatHeaderProps) {
    if (!friend) return null;

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
        </div>
    );
}
