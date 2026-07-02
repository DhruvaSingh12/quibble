"use client";

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ky from "@/lib/ky";
import { useToast } from "@/components/ui/use-toast";
import { FaMessage } from "react-icons/fa6";

interface MessageButtonProps {
    userId: string;
}

export default function MessageButton({ userId }: MessageButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleMessageClick = async () => {
        try {
            setLoading(true);
            const url = `chat/conversations`;
            const res = await ky.post(url, {
                json: { targetUserId: userId },
            }).json<{ conversationId: string }>();

            router.push(`/messages/${res.conversationId}`);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to start conversation.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={handleMessageClick}
            disabled={loading}
            className="flex items-center gap-2 rounded-full"
        >
            <FaMessage className="h-6 w-6" />
        </Button>
    );
}
