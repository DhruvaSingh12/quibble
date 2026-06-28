"use client";

import { useState } from "react";
import FollowConnectionModal from "./FollowConnectionModal";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface FollowingCountProps {
    userId: string;
    initialState: { following: number };
}

function FollowingCount({ userId, initialState }: FollowingCountProps) {
    const [showModal, setShowModal] = useState(false);

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);

    return (
        <div>
            <Button
                onClick={openModal}
                variant="ghost"
                size="sm"
                className="gap-2 group hover:bg-muted border"
            >
                <span className="font-semibold">{formatNumber(initialState.following)}</span>
                <span className="group-hover:text-foreground transition-colors">
                    Following
                </span>
            </Button>
            {showModal && (
                <FollowConnectionModal
                    userId={userId}
                    initialTab="following"
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default FollowingCount;