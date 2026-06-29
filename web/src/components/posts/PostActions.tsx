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
import { useSession } from "@/providers/SessionProvider";
import DeletePostDialog from "./delete/DeletePostDialog";
import EditPostDialog from "./edit/EditPostDialog";

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

  const { user } = useSession();

  // Only show the dropdown if the user is the post author
  if (user?.id !== post.user.id) return null;

  return (
    <>
      <DropdownMenu onOpenChange={(isOpen) => onDropdownToggle?.(isOpen)}>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontalIcon className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-24">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => setShowEditDialog(true)}
          >
            <Edit className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
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
    </>
  );
}
