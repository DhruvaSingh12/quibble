import React from "react";
import UserAvatar from "./UserAvatar";
import { FaX } from "react-icons/fa6";
import Link from "next/link";
import { FollowerInfo } from "@/lib/types";

interface FollowerModalProps {
    followers: FollowerInfo[];
    onClose: () => void;
}

function FollowerModal({ followers, onClose }: FollowerModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-muted relative rounded-lg p-6 w-[330px] lg:w-96 max-h-[80vh] overflow-y-auto">
                <button
                    className="absolute top-4 right-4 hover:bg-black/20 rounded-full p-2 transition-transform duration-500"
                    onClick={onClose}
                >
                    <FaX size={14} />
                </button>
                <h2 className="text-lg font-semibold mb-4">Followers</h2>
                <ul className="space-y-4">
                    {followers.map((follower, index) => {
                        if (!follower || !follower.id) {
                            console.warn(`Invalid follower at index ${index}:`, follower);
                            return null; 
                        }

                        return (
                            <li key={follower.id} className="flex relative items-center gap-4">
                                <p className="text-lg mr-2">{index + 1}.</p>
                                <Link
                                    href={`/users/${follower.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={`View ${follower.displayName}'s profile`}
                                >
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
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default FollowerModal;
