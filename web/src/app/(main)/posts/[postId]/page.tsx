import { validateRequest } from "@/auth";
import SinglePost from "./SinglePost";
import CommentSection from "@/components/comments/CommentSection";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Metadata } from "next";

import { PostData } from "@/lib/types";

interface PageProps {
    params: Promise<{ postId: string }>;
}

const getPost = cache(async (postId: string) => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/${postId}`, {
            headers: sessionId ? { Cookie: `session=${sessionId}` } : {},
            cache: "no-store",
            signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) {
            if (res.status === 404) notFound();
            throw new Error("Failed to fetch post");
        }

        return res.json() as Promise<PostData>;
    } catch (e: any) {
        if (e.name === "AbortError" || e.name === "TimeoutError" || e.message?.includes("fetch failed")) {
            throw new Error("GATEWAY_TIMEOUT");
        }
        throw e;
    }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { postId } = await params;
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) return {};

    const post = await getPost(postId);

    return {
        title: `${post.user.displayName} on Quibble`
    };
}

export default async function Page({ params }: PageProps) {
    const { postId } = await params;
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
        return (
            <p className="text-destructive">
                You&apos;re not authorized to view this page.
            </p>
        );
    }

    const post = await getPost(postId);

    return (
        <main className="w-full mt-[3px] lg:mt-[8px] flex flex-col rounded-lg items-center justify-center">
            <div className="w-full flex-col min-w-0">
                <SinglePost post={post} />
                <CommentSection postId={postId} postAuthorId={post.userId} />
            </div>
        </main>
    );
}

