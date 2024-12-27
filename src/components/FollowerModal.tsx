import React from "react";
import UserAvatar from "./UserAvatar";
import { FaX } from "react-icons/fa6";
import Link from "next/link";
import { Follower } from "@/lib/types";
import FollowButton from "./FollowButton";

interface FollowerModalProps {
    followers: Follower[];
    onClose: () => void;
}

function FollowerModal({ followers, onClose }: FollowerModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-muted relative rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
                <button
                    className="absolute top-4 right-4 hover:bg-black/20 rounded-full p-2 transition-transform duration-500"
                    onClick={onClose}
                >
                    <FaX size={14} />
                </button>
                <h2 className="text-lg font-semibold mb-4">
                    Followers
                </h2>
                <ul className="space-y-4">
                    {followers.map((follower, index) => (
                        <li key={follower.id} className="flex relative items-center gap-4">
                            <p className="text-lg mr-2">{index + 1}.</p>
                            <Link href={`/users/${follower.username}`} target="_blank" rel="noopener noreferrer" title={`View ${follower.displayName}'s profile`}>
                                <UserAvatar
                                    avatarUrl={follower.avatarUrl}
                                    size={500}
                                    className="w-12 lg:w-16 h-12 lg:h-16 rounded-full"
                                />
                            </Link>
                            <div>
                                <Link
                                    href={`/users/${follower.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-lg hover:underline"
                                >
                                    {follower.displayName}
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                    @{follower.username}
                                </p>
                                {follower.bio && (
                                    <p className="text-sm">
                                        {follower.bio}
                                    </p>
                                )}
                            </div>
                            <div className="absolute right-4">
                                <FollowButton
                                    userId={follower.id}
                                    initialState={{
                                        isFollowedByUser: follower.isFollowing ?? false,
                                        followers: follower.followersCount ?? 0,
                                        followerList: follower.followerList || [],
                                    }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default FollowerModal;
