"use client";

import SearchField from "@/components/ui/SearchField";
import UserButton from "@/components/UserButton";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {

  return (
    <nav className="shadpw-sm sticky z-10 bg-destructive-foreground p-1 top-2 mx-2 rounded-2xl">
      <div className="mx-auto flex flex-row items-center justify-between px-0 py-1 lg:gap-5 lg:px-3 lg:py-[6px]">
        <Link href="/" passHref>
          <div className="flex cursor-pointer">
            <Image
              src="/quibble.png"
              alt="quibble."
              width={130}
              height={70}
              priority
              className="h-auto"
              sizes="(max-width: 1024px) 100px, 120px"
            />
          </div>
        </Link>
        <SearchField />
        <UserButton className="mx-2" />
      </div>
    </nav>
  );
}
