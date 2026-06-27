import { validateRequest } from "@/auth";
import Post from "@/components/posts/Post";
import CommentSection from "@/components/comments/CommentSection";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ postId: string }>;
}

const getPost = cache(async (postId: string, loggedInUserId: string) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: getPostDataInclude(loggedInUserId)
    });

    if (!post) notFound();

    return post;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { postId } = await params;
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) return {};

    const post = await getPost(postId, loggedInUser.id);

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

    const post = await getPost(postId, loggedInUser.id);

    return (
        <main className="w-full mt-[3px] lg:mt-[8px] flex flex-col rounded-lg items-center justify-center">
            <div className="w-full flex-col min-w-0">
                <Post post={post} />
                <CommentSection postId={postId} postAuthorId={post.userId} />
            </div>
        </main>
    );
}

