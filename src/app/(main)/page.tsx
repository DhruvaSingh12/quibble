import React from 'react';
import PostEditor from "@/components/posts/editor/PostEditor";
import ForYouFeed from './components/ForYouFeed';

export default function Home() {

  return (
    <div className="w-full p-3 lg:p-5 mt-[3px] lg:mt-[8px] flex-col rounded-2xl items-center justify-center space-y-5 bg-accent">
      <PostEditor/>
      <ForYouFeed/>      
    </div>
  );
}
