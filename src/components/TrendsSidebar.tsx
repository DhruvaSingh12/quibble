import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { userDataSelect } from "@/lib/types";
import { Loader2, PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import UserAvatar from "./UserAvatar";
import { Button } from "./ui/Button";
import { unstable_cache } from "next/cache";
import { formatNumber } from "@/lib/utils";

interface TrendsSidebarProps {
    className?: string;
}

export default function TrendsSidebar({ className }: TrendsSidebarProps) {

    return (
        <div className={className}>
            <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
                <div className="bg-card rounded-2xl px-3 lg:px-5 py-3 shadow-sm">
                    <WhoToFollow />
                </div>
                <div className="bg-card rounded-2xl px-3 lg:px-5 py-3 shadow-sm">
                    <TrendingTopics />
                </div>

            </Suspense>
        </div>
    )
}

async function WhoToFollow() {
    const { user } = await validateRequest();
    if (!user) return null;


    const usersToFollow = await prisma.user.findMany({
        where: {
            NOT: {
                id: user.id
            },
        },
        select: userDataSelect,
        take: 5
    })

    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">Who to follow</h2>
            <div>
                {usersToFollow.map((user) => (
                    <div key={user.id} className="flex items-center justify-between gap-3">
                        <Link href={`/users/${user.username}`} className="flex items-center gap-3">
                            <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />
                            <div className="flex flex-col">
                                <span className="line-clamp-1 break-all font-semibold hover:underline">{user.displayName}</span>
                                <span className="line-clamp-1 break-all text-muted-foreground">@{user.username}</span>
                            </div>
                        </Link>
                        <Button className="rounded-full p-3 bg-accent-foreground"><PlusIcon size={23} /></Button>
                    </div>
                ))}
            </div>
        </div>
    )
}

const getTrendingTopics = unstable_cache(
    async () => {
        const result = await prisma.$queryRaw<{ hashtag: string; count: bigint }[]>`
        SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, 
        COUNT(*) as count FROM posts 
        GROUP BY (hashtag) 
        ORDER BY count DESC, hashtag ASC 
        LIMIT 5`;

        return result.map((row) => ({
            hashtag: row.hashtag,
            count: Number(row.count),
        }));
    }, ["trending_topics"],
    { revalidate: 60 * 60 }, // 1 hour
);

async function TrendingTopics() {
    const { user } = await validateRequest();
    if (!user) return null;
    const trendingTopics = await getTrendingTopics();

    return (
        <div>
            <h2 className="text-xl font-semibold mb-3">Trending Topics</h2>
            <div>
                {trendingTopics.map(({hashtag, count}) => {
                    const title = hashtag.split("#")[1];

                    return (
                        <Link key={title} href={'/hashtag/${title}'} className="flex flex-row justify-between">
                            <p className="line-clamp-1 break-all font-semibold hover:underline" title={hashtag}>{hashtag}</p>
                            <p className="line-clamp-1 break-all text-muted-foreground">{formatNumber(count)} {count === 1 ? "post" : "posts"}</p>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}