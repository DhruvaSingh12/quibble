import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import SessionProvider from "../../providers/SessionProvider";
import Navbar from "./components/Navbar";
import MenuBar from "./components/MenuBar";
import TrendsSidebar from "@/components/TrendsSidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await validateRequest();
  if (!session.user) redirect("/login");

  return (
    <SessionProvider value={session}>
      <div suppressHydrationWarning={true} className="flex w-full h-full fixed inset-0">
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-[200px] lg:w-[300px] bg-background pl-2 py-2 h-full">
          <MenuBar />
        </div>

        {/* Main content */}
        <div className="flex-1 w-full h-full overflow-hidden flex flex-col py-2 px-2 bg-background">
          <div className="flex-none pb-2">
            <Navbar />
          </div>
          <div className="flex-1 overflow-hidden flex gap-2">
            <div className="flex-1 min-w-0 h-full overflow-y-auto scrollbar-hide bg-card rounded-lg border border-border shadow-sm">
              {children}
            </div>
            <div className="hidden lg:block w-[200px] lg:w-[300px] flex-none h-full overflow-y-auto scrollbar-hide">
              <TrendsSidebar className="space-y-2 pb-2" />
            </div>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}