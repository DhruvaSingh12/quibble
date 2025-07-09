"use client";

import React, { useState } from "react";
import FollowerModal from "./FollowerModal";
import { FollowerListItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface FollowerCountProps {
    userId: string;
    initialState: { followers: number };
}

function FollowerCount({ userId, initialState }: FollowerCountProps) {
    const [data] = useState(initialState);
    const [followerList, setFollowerList] = useState<FollowerListItem[]>([]);
    const [showModal, setShowModal] = useState(false);

    const fetchFollowers = async () => {
        try {
            const response = await fetch(`/api/users/${userId}/followers`);
            if (!response.ok) {
                throw new Error("Failed to fetch followers");
            }
            const result = await response.json();
            setFollowerList(result.followerList || []);
        } catch (error) {
            console.error("Error fetching followers:", error);
        }
    };

    const openModal = async () => {
        await fetchFollowers();
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
                <span className="font-semibold">{formatNumber(data.followers)}</span>
                <span className="group-hover:text-foreground transition-colors">
                    {data.followers === 1 ? "Follower" : "Followers"}
                </span>
            </Button>
            {showModal && (
                <FollowerModal
                    followers={followerList}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default FollowerCount;
