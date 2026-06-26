"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

function NotFound() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="h-full w-full bg-black text-white">
      <div className="flex flex-col items-center justify-center gap-4 bg-black">
        <div className="mt-4 flex flex-col items-center justify-center rounded-lg bg-white p-4">
          <Logo className="text-4xl sm:text-5xl text-black" />
        </div>
        <div className="relative flex items-center justify-center">
          <Image width={400} height={400} src="/404.png" alt="404 Not Found" />
        </div>
        <h1 className="text-center text-4xl font-extrabold text-white drop-shadow-xl">
          Oops! We can&apos;t find that page
        </h1>
        <p className="mx-4 text-center text-xl text-gray-300 drop-shadow-md">
          The page you are looking for might have been moved or deleted.
        </p>
        <div
          onClick={handleBackToHome}
          className="mt-4 transform cursor-pointer rounded-full bg-purple-700 px-10 py-3 text-xl text-white shadow-lg drop-shadow-2xl transition-transform hover:scale-105 hover:bg-purple-600"
        >
          Take me home
        </div>
        <div className="mt-2 text-center text-sm text-gray-400">
          <p>
            Or, check our{" "}
            <Link href="/" className="text-purple-300 hover:underline">
              homepage
            </Link>{" "}
            for more information.
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
