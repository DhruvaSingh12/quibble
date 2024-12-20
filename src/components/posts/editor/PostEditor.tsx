"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useSession } from "@/providers/SessionProvider";
import UserAvatar from "@/components/UserAvatar";
import "./styles.css";
import { useSubmitPostMutation } from "./mutations";
import LoadingButton from "@/components/LoadingButton";

export default function PostEditor() {

    const { user } = useSession();
    const mutation = useSubmitPostMutation();

    const editor = useEditor({
        extensions: [StarterKit.configure({}),
        Placeholder.configure({
            placeholder: "What\u0027s on your mind?",
        })
        ],
        immediatelyRender: false,
    })

    const input = editor?.getText({
        blockSeparator: "\n",
    }) || "";

    function onSubmit() {
        mutation.mutate(input, {
            onSuccess: () => {
                editor?.commands.clearContent();
            }
        });
    }

    return (
        <div className="flex flex-col rounded-2xl bg-card p-3 lg:p-5 shadow-sm">
            <div className="flex gap-2 lg:gap-5 items-center justify-center">
                <UserAvatar avatarUrl={user.avatarUrl} size={500} className="lg:w-[50px] w-[48px] sm:inline" />
                <EditorContent editor={editor}
                    className="w-full rounded-2xl px-2 lg:px-5 py-3 border bg-background overflow-y-auto lg:max-h-[200px] max-h-[100px]" />
                <div className="flex justify-end">
                    <LoadingButton 
                        loading={mutation.isPending}
                        onClick={onSubmit} disabled={!input.trim()}
                        className="min-w-10 lg:min-w-20"
                    >
                        Post
                    </LoadingButton>
                </div>
            </div>
        </div>
    )
}