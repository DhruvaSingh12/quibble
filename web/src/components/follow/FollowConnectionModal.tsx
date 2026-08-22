import { FaX } from "react-icons/fa6";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import FollowerList from "./FollowerList";
import FollowingList from "./FollowingList";

interface FollowConnectionModalProps {
  userId: string;
  initialTab: "followers" | "following";
  onClose: () => void;
}

export default function FollowConnectionModal({
  userId,
  initialTab,
  onClose,
}: FollowConnectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-card shadow-2xl">

        <Tabs defaultValue={initialTab} className="flex h-full flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4">
            <TabsList className="flex-1">
              <TabsTrigger value="followers" className="flex-1">
                Followers
              </TabsTrigger>
              <TabsTrigger value="following" className="flex-1">
                Following
              </TabsTrigger>
            </TabsList>
            <button
              className="rounded-full p-2 transition-colors hover:bg-muted"
              onClick={onClose}
            >
              <FaX size={14} className="text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 h-full min-h-75">
            <TabsContent value="followers" className="m-0 h-full data-[state=active]:flex flex-col">
              <FollowerList userId={userId} onClose={onClose} />
            </TabsContent>

            <TabsContent value="following" className="m-0 h-full data-[state=active]:flex flex-col">
              <FollowingList userId={userId} onClose={onClose} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}