import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps{
    avatarUrl: string | null | undefined;
    size?: number;
    className?: string;
}

export default function UserAvatar({
    avatarUrl, size, className
}: UserAvatarProps) {
    return (
        <Image
        src={avatarUrl || "/avatar-placeholder.png"}
        alt="avatar"
        height={size || 48}
        width={size || 48}
        className={cn("rounded-full flex-none h-fit aspect-auto bg-secondary image-cover", className)}
        />
    )
}