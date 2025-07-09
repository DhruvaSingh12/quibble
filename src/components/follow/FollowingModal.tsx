import React from "react";
import UserAvatar from "../UserAvatar";
import FollowButton from "./FollowButton";
import { FaX } from "react-icons/fa6";
import Link from "next/link";
import { FollowerListItem } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";

interface FollowingModalProps {
  following: FollowerListItem[];
  onClose: () => void;
}

function FollowingModal({ following, onClose }: FollowingModalProps) {
  const { user: currentUser } = useSession();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-card p-4">
          <h2 className="text-xl font-semibold text-card-foreground">
            Following
          </h2>
          <button
            className="rounded-full p-2 transition-colors hover:bg-muted"
            onClick={onClose}
          >
            <FaX size={12} className="text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-[calc(85vh-80px)] overflow-y-auto">
          {following.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12">
              <div className="mb-4 text-6xl">👥</div>
              <h3 className="mb-2 text-lg font-medium text-card-foreground">
                Not following anyone yet
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                When this account follows others, you'll see them here.
              </p>
            </div>
          ) : (
            <ul>
              {following.map((followedUser, index) => {
                if (!followedUser || !followedUser.id) {
                  console.warn(
                    `Invalid following user at index ${index}:`,
                    followedUser,
                  );
                  return null;
                }

                return (
                  <li
                    key={followedUser.id}
                    className="px-5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-1 md:gap-2">
                      <Link
                        href={`/users/${followedUser.username}`}
                        className="flex-shrink-0"
                        onClick={onClose}
                      >
                        <UserAvatar
                          avatarUrl={followedUser.avatarUrl}
                          size={500}
                          className="h-12 w-12 rounded-full ring-2 ring-primary/10 transition-all hover:ring-primary/20"
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/users/${followedUser.username}`}
                          className="block"
                          onClick={onClose}
                        >
                          <div className="truncate font-semibold text-card-foreground hover:underline">
                            {followedUser.displayName || followedUser.username}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            @{followedUser.username}
                          </div>
                        </Link>

                        {followedUser.bio && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {followedUser.bio}
                          </p>
                        )}
                      </div>

                      {followedUser.id !== currentUser.id && (
                        <div className="flex-shrink-0">
                          <FollowButton
                            userId={followedUser.id}
                            initialState={{
                              id: followedUser.id,
                              username: followedUser.username,
                              displayName: followedUser.displayName || followedUser.username,
                              avatarUrl: followedUser.avatarUrl,
                              bio: followedUser.bio,
                              followers: 0,
                              isFollowedByUser: followedUser.isFollowedByUser,
                            }}
                          />
                        </div>
                      )}

                      {followedUser.id === currentUser.id && (
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
        {following.length > 0 && (
          <div className="border-t border-border bg-muted/30 p-2 text-center">
            <p className="text-sm text-muted-foreground">
              {following.length}{" "}following
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FollowingModal;
