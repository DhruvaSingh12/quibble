import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ResetPasswordForm from "./components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="h-screen flex items-center justify-center p-4 bg-[url('/auth-back.jpg')] bg-cover bg-center bg-background text-foreground">
      <div className="flex flex-col md:flex-row h-full max-h-[640px] w-full max-w-[1024px] overflow-hidden rounded-3xl bg-white/30 backdrop-blur-sm shadow-xl">
        <div className="hidden md:block md:w-1/2 relative">
          <Image
            src="/login-image.jpg"
            alt="Reset password illustration"
            fill
            className="object-cover rounded-l-3xl"
            priority
          />
        </div>
        
        <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-between px-4 py-2 overflow-y-auto">
          <div className="w-full flex-col gap-y-2 mt-4 items-center flex justify-center">
            <Image
              src="/quibble.png"
              alt="Quibble logo"
              width={180}
              height={40}
              className="object-contain"
              priority
            />
            <p className="text-3xl">Create New Password</p>
          </div>

          <div className="w-full">
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-center">
                <h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
                <p className="mb-4">
                  The password reset link is invalid or has expired. Please request a new one.
                </p>
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Request New Password Reset
                </Link>
              </div>
            )}
          </div>
          
          <div className="w-full text-center">
            <div className="flex flex-row gap-2 justify-center mb-4 items-center text-lg text-black">
              Remember your password? <Link href="/login" className="text-primary hover:underline">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
