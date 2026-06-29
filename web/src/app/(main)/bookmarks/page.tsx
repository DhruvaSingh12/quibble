import { Metadata } from "next";
import BookmarksFeed from "../components/BookmarksFeed";

export const metadata: Metadata = {
  title: "Bookmarks",
};

export default function BookmarksPage() {
  return (
    <main className="flex flex-col h-full w-full min-w-0">
      {/* Scrollable Feed */}
      <div className="flex-1 w-full">
        <div className="w-full p-2 lg:p-6 min-h-full">
          <BookmarksFeed />
        </div>
      </div>
    </main>
  );
}
