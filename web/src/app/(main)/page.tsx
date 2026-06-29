import ForYouFeed from './components/ForYouFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import FollowingFeed from './components/FollowingFeed';
import MyPosts from './components/MyPosts';
import PostEditor from '@/components/posts/create/CreatePostDialog';

export default function Home() {
  return (
    <div className="w-full flex flex-col">
      <Tabs defaultValue='for-you'>
        <div className="p-4 space-y-2">
          <PostEditor />
          <TabsList>
            <TabsTrigger value='for-you'>For You</TabsTrigger>
            <TabsTrigger value='following'>Following</TabsTrigger>
            <TabsTrigger value='by-you'>Your Posts</TabsTrigger>
          </TabsList>
        </div>
        <div className="p-4 pt-0">
          <TabsContent value='for-you' className="mt-0">
            <ForYouFeed />
          </TabsContent>
          <TabsContent value='following' className="mt-0">
            <FollowingFeed />
          </TabsContent>
          <TabsContent value='by-you' className="mt-0">
            <MyPosts />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
