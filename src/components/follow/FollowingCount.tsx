"use client";

import React, { useState } from "react";
import FollowingModal from "./FollowingModal";
import { FollowerListItem } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

interface FollowingCountProps {
    userId: string;
    initialState: { following: number };
}

function FollowingCount({ userId, initialState }: FollowingCountProps) {
    const [showModal, setShowModal] = useState(false);

    const { data: followingList, refetch, isFetching } = useQuery({
        queryKey: ["following", userId],
        queryFn: async () => {
            const result = await kyInstance.get(`/api/users/${userId}/following`).json<{ followingList: FollowerListItem[] }>();
            return result.followingList || [];
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
                <span className="font-semibold">{formatNumber(initialState.following)}</span>
                <span className="group-hover:text-foreground transition-colors">
                    Following
                </span>
            </Button>
            {showModal && (
                <FollowingModal
                    following={followingList || []}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}

export default FollowingCount;
