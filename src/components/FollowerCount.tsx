"use client";

import React, { useState } from "react";
import FollowerModal from "./FollowerModal";
import { Follower } from "@/lib/types";

interface FollowerCountProps {
    userId: string;
    initialState: { followers: number };
}

function FollowerCount({ userId, initialState }: FollowerCountProps) {
    const [data] = useState(initialState);
    const [followerList, setFollowerList] = useState<Follower[]>([]);
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
            <span
                className="flex flex-row gap-2 cursor-pointer"
                onClick={openModal}
            >
                <p className="font-semibold">{data.followers}</p>{" "}
                {data.followers === 1 ? "Follower" : "Followers"}
            </span>
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
