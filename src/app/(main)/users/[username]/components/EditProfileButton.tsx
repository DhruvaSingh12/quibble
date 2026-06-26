"use client";

import { Button } from "@/components/ui/Button";
import { UserData } from "@/lib/types";
import { useState } from "react";
import { UserCog } from "lucide-react";
import EditProfileDialog from "./EditProfileDialog";

interface EditProfileButtonProps {
  user: UserData;
}

export default function EditProfileButton({ user }: EditProfileButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-muted/20 hover:bg-muted/50 border-transparent transition-colors" onClick={() => setShowDialog(true)}>
        <UserCog className="h-5 w-5" />
      </Button>
      <EditProfileDialog
        user={user}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  );
}