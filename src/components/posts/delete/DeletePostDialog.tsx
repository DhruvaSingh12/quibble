import { PostData } from "@/lib/types";
import { useDeletePostMutation } from "./mutations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/Button";

interface DeletePostDialogProps {
    post: PostData;
    open: boolean;
    onClose: () => void;
}

export default function DeletePostDialog({ post, open, onClose }: DeletePostDialogProps) {

    const mutation = useDeletePostMutation();
    function handleOpenChange(open: boolean) {
        if(!open || !mutation) onClose();
    }
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-background">
                <DialogHeader>
                    <DialogTitle>Delete post?</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this post? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <LoadingButton 
                    variant="destructive" 
                    onClick={() => mutation.mutate(post.id, {onSuccess: onClose})}
                    loading={mutation.isPending}
                    className="bg-red-500 hover:bg-red-700"
                    >
                        Delete
                    </LoadingButton>
                    <Button variant="outline" onClick={onClose} disabled={mutation.isPending} className="bg-white hover:bg-gray-100">Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
