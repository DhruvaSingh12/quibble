"use client";

import { useState } from "react";
import FollowConnectionModal from "./FollowConnectionModal";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FollowerInfo } from "@/lib/types";
import useFollowerInfo from "@/hooks/useFollowerInfo";

interface FollowerCountProps {
    userId: string;
    initialState: FollowerInfo;
}

function FollowerCount({ userId, initialState }: FollowerCountProps) {
    const [showModal, setShowModal] = useState(false);

    const { data } = useFollowerInfo(userId, initialState);

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
                <span className="font-semibold">{formatNumber(data.followers)}</span>
                <span className="group-hover:text-foreground transition-colors">
                    {data.followers === 1 ? "Follower" : "Followers"}
                </span>
            </Button>
            {showModal && (
                <FollowConnectionModal
                    userId={userId}
                    initialTab="followers"
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default FollowerCount;