"use client";

import { PostData } from "@/lib/types";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { MoreHorizontalIcon, Trash2, Edit } from "lucide-react";
import { HiOutlineShare } from "react-icons/hi";
import { useSession } from "@/providers/SessionProvider";
import DeletePostDialog from "./delete/DeletePostDialog";
import EditPostDialog from "./edit/EditPostDialog";
import ShareModal from "./share/ShareModal";

interface PostActionsProps {
  post: PostData;
  className?: string;
  onDropdownToggle?: (isOpen: boolean) => void;
}

export default function PostActions({
  post,
  className,
  onDropdownToggle,
}: PostActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { user } = useSession();
  const pageLink = `${window.location.origin}/posts/${post.id}`;

  return (
    <>
      <DropdownMenu onOpenChange={(isOpen) => onDropdownToggle?.(isOpen)}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontalIcon className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="items-center hover:cursor-pointer justify-center hover:bg-muted-foreground"
            onClick={() => setShowShareModal(true)}
          >
            <span className="flex gap-3 text-primary">
              <HiOutlineShare className="size-4" />
              Share
            </span>
          </DropdownMenuItem>
          {user?.id === post.user.id && (
            <>
              <DropdownMenuItem
                className="items-center hover:cursor-pointer justify-center hover:bg-muted-foreground"
                onClick={() => setShowEditDialog(true)}
              >
                <span className="flex gap-3 text-primary">
                  <Edit className="size-4" />
                  Edit
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="items-center hover:cursor-pointer justify-center hover:bg-muted-foreground"
                onClick={() => setShowDeleteDialog(true)}
              >
                <span className="flex gap-3 text-destructive">
                  <Trash2 className="size-4" />
                  Delete
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeletePostDialog
        post={post}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
      <EditPostDialog
        post={post}
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
      />
      {showShareModal && (
        <ShareModal
          pageLink={pageLink}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
