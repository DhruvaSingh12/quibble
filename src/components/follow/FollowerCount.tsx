"use client";

import React, { useState } from "react";
import FollowerModal from "./FollowerModal";
import { FollowerListItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

interface FollowerCountProps {
    userId: string;
    initialState: { followers: number };
}

function FollowerCount({ userId, initialState }: FollowerCountProps) {
    const [showModal, setShowModal] = useState(false);

    const { data: followerList, refetch, isFetching } = useQuery({
        queryKey: ["followers", userId],
        queryFn: async () => {
            const result = await kyInstance.get(`/api/users/${userId}/followers`).json<{ followerList: FollowerListItem[] }>();
            return result.followerList || [];
        },
        enabled: false, // Only fetch when manually triggered
        staleTime: 1000 * 60 * 2, // 2 minutes
        refetchOnWindowFocus: false,
    });

    const openModal = async () => {
        await refetch();
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
                disabled={isFetching}
            >
                <span className="font-semibold">{formatNumber(initialState.followers)}</span>
                <span className="group-hover:text-foreground transition-colors">
                    {initialState.followers === 1 ? "Follower" : "Followers"}
                </span>
            </Button>
            {showModal && (
                <FollowerModal
                    followers={followerList || []}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default FollowerCount;
