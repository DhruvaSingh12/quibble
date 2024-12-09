import { UserData } from "@/lib/types";
import { useSession } from "@/providers/SessionProvider";
import { PropsWithChildren } from "react";

interface UserTooltipProps extends PropsWithChildren {
    user: UserData;
}

export default function UserTooltip({ user, children }: UserTooltipProps) {
    const {user: loggedInUser} = useSession();

    return (
        <div className="group relative">
        </div>
    );
}