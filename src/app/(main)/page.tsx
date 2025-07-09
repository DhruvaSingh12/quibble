import React from 'react';
import ForYouFeed from './components/ForYouFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import FollowingFeed from './components/FollowingFeed';
import MyPosts from './components/MyPosts';
import PostEditor from '@/components/posts/create/CreatePostDialog';

export default function Home() {

  return (
    <div className="w-full mt-[3px] lg:mt-[8px] flex-col rounded-2xl items-center justify-center space-y-3">
      <PostEditor />
      <Tabs defaultValue='for-you'>
        <TabsList>
          <TabsTrigger value='for-you'>For You</TabsTrigger>
          <TabsTrigger value='following'>Following</TabsTrigger>
          <TabsTrigger value='by-you'>Your Posts</TabsTrigger>
        </TabsList>
        <TabsContent value='for-you'>
          <ForYouFeed />
        </TabsContent>
        <TabsContent value='following'>
          <FollowingFeed />
        </TabsContent>
        <TabsContent value='by-you'>
          <MyPosts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
