import React from "react";
import UserAvatar from "../UserAvatar";
import FollowButton from "./FollowButton";
import { FaX } from "react-icons/fa6";
import Link from "next/link";
import { FollowerListItem } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";

interface FollowerModalProps {
  followers: FollowerListItem[];
  onClose: () => void;
}

function FollowerModal({ followers, onClose }: FollowerModalProps) {
  const { user: currentUser } = useSession();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card p-4">
          <h2 className="text-xl font-semibold text-card-foreground">
            Followers
          </h2>
          <button
            className="rounded-full p-2 transition-colors hover:bg-muted"
            onClick={onClose}
          >
            <FaX size={12} className="text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-80px)] overflow-y-auto">
          {followers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <div className="mb-4 text-6xl">👥</div>
              <h3 className="mb-2 text-lg font-medium text-card-foreground">
                No followers yet
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                When people follow this account, you'll see them here.
              </p>
            </div>
          ) : (
            <ul>
              {followers.map((follower, index) => {
                if (!follower || !follower.id) {
                  console.warn(`Invalid follower at index ${index}:`, follower);
                  return null;
                }

                const isCurrentUser = currentUser.id === follower.id;

                return (
                  <li
                    key={follower.id}
                    className="px-5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-1 md:gap-2">
                      <Link
                        href={`/users/${follower.username}`}
                        className="flex-shrink-0"
                        onClick={onClose}
                      >
                        <UserAvatar
                          avatarUrl={follower.avatarUrl}
                          size={500}
                          className="h-12 w-12 rounded-full ring-2 ring-primary/10 transition-all hover:ring-primary/20"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/users/${follower.username}`}
                          className="block"
                          onClick={onClose}
                        >
                          <div className="truncate font-semibold text-card-foreground hover:underline">
                            {follower.displayName}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            @{follower.username}
                          </div>
                        </Link>

                        {follower.bio && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {follower.bio}
                          </p>
                        )}
                      </div>

                      {!isCurrentUser && (
                        <div className="flex-shrink-0">
                          <FollowButton
                            userId={follower.id}
                            initialState={{
                              id: follower.id,
                              username: follower.username,
                              displayName: follower.displayName,
                              avatarUrl: follower.avatarUrl,
                              bio: follower.bio,
                              followers: 0,
                              isFollowedByUser: follower.isFollowedByUser,
                            }}
                          />
                        </div>
                      )}

                      {isCurrentUser && (
                        <div className="flex-shrink-0">
                          <span className="rounded-full bg-muted px-3 py-1 text-base font-medium text-muted-foreground">
                            You
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {followers.length > 0 && (
          <div className="border-t border-border bg-muted/30 p-2 text-center">
            <p className="text-sm text-muted-foreground">
              {followers.length}{" "}
              {followers.length === 1 ? "follower" : "followers"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowerModal;
