"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import { FollowerInfo } from "@/lib/types";

interface FollowerCountProps {
    userId: string;
    initialState: FollowerInfo;
}

export default function FollowerCount({ userId, initialState }: FollowerCountProps) {
    const {data} = useFollowerInfo(userId, initialState);
    return (
        <span>
            Followers:{" "}
            <span className="font-semibold">
                {data.followers}
            </span>
        </span>
    );
}