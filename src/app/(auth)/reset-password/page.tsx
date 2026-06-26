import { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
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
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="flex flex-col md:flex-row h-full w-full max-w-[900px] md:h-[600px] overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        
        {/* Welcome Panel */}
        <div className="hidden md:flex w-1/2 bg-muted relative flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <Logo className="text-8xl" />
          <p className="mt-6 text-muted-foreground max-w-xs">
            Let's get you a new password so you can get back to Quibbling.
          </p>
        </div>
        
        {/* Form Area */}
        <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:px-8 md:py-12 overflow-y-auto">
          <div className="w-full flex flex-col gap-y-2 mt-4 mb-8 items-center justify-center">
            <div className="md:hidden flex justify-center mb-6">
              <Logo className="text-5xl" />
            </div>
            <p className="text-2xl mt-4 font-semibold text-foreground">Create new password</p>
          </div>

          <div className="w-full flex-1 flex flex-col justify-center">
            {token ? (
              <ResetPasswordForm token={token} />
            ) : (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-center">
                <h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
                <p className="mb-4 text-sm">
                  The password reset link is invalid or has expired. Please request a new one.
                </p>
                <Link href="/forgot-password" className="text-primary hover:underline font-medium text-sm">
                  Request New Password Reset
                </Link>
              </div>
            )}
          </div>
          
          <div className="w-full text-center mt-6">
            <div className="flex flex-row gap-2 justify-center items-center text-sm text-muted-foreground">
              Remember your password? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
