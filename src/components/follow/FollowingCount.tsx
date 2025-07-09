"use client";

import React, { useState } from "react";
import FollowingModal from "./FollowingModal";
import { FollowerListItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface FollowingCountProps {
    userId: string;
    initialState: { following: number };
}

function FollowingCount({ userId, initialState }: FollowingCountProps) {
    const [data] = useState(initialState);
    const [followingList, setFollowingList] = useState<FollowerListItem[]>([]);
    const [showModal, setShowModal] = useState(false);

    const fetchFollowing = async () => {
        try {
            const response = await fetch(`/api/users/${userId}/following`);
            if (!response.ok) {
                throw new Error("Failed to fetch following users");
            }
            const result = await response.json();
            setFollowingList(result.followingList || []);
        } catch (error) {
            console.error("Error fetching following:", error);
        }
    };

    const openModal = async () => {
        await fetchFollowing();
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    return (
        <div>
            <Button
                onClick={openModal}
                variant="ghost"
                size="sm"
                className="gap-2 group hover:bg-muted border"
            >
                <span className="font-semibold">{formatNumber(data.following)}</span>
                <span className="group-hover:text-foreground transition-colors">
                    Following
                </span>
            </Button>
            {showModal && (
                <FollowingModal
                    following={followingList}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default FollowingCount;
