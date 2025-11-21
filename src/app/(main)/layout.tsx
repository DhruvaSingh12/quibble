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
      <div suppressHydrationWarning={true} className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-7xl grow gap-5 px-3 py-5">
          <MenuBar className="sticky top-[95px] hidden h-fit flex-none space-y-3 rounded-2xl bg-card px-2 py-5 shadow-sm sm:block lg:px-5" />
          {children}
          <TrendsSidebar className="sticky top-[95px] hidden h-fit flex-none space-y-3 w-[220px] md:w-[250px] lg:w-[300px] lg:block"/>
        </div>
        <MenuBar className="sticky bottom-3 mx-3 flex justify-between rounded-2xl border-t bg-card p-3 shadow-sm sm:hidden" />
      </div>
    </SessionProvider>
  );
}
