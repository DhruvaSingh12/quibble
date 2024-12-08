import { PostData } from "@/lib/types";
import { useState } from "react";
import DeletePostDialog from "./DeletePostDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { MoreHorizontalIcon, Trash2 } from "lucide-react";

interface DeleteButtonProps {
    post: PostData;
    className?: string;
    onDropdownToggle?: (isOpen: boolean) => void;
}

export default function DeleteButton({
    post,
    className,
    onDropdownToggle,
}: DeleteButtonProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <DropdownMenu
                onOpenChange={(isOpen) => onDropdownToggle?.(isOpen)}
            >
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className={className}>
                        <MoreHorizontalIcon className="size-5 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem className="items-center justify-center hover:bg-muted-foreground" onClick={() => setShowDeleteDialog(true)}>
                        <span className="flex gap-3 text-destructive">
                            <Trash2 className="size-4" />
                            Delete
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <DeletePostDialog
                post={post}
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
            />
        </>
    );
}
