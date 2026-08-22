import { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import VerifyEmailForm from "./components/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email } = await searchParams;

  if (!email) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="flex flex-col md:flex-row h-full w-full max-w-225 md:h-150 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">

          {/* Welcome Panel */}
          <div className="hidden md:flex w-1/2 bg-muted relative flex-col items-center justify-center p-8 text-center bg-linear-to-br from-primary/5 via-transparent to-transparent">
            <Logo className="text-8xl" />
            <p className="mt-6 text-muted-foreground max-w-xs">
              Check your inbox! We need to verify your email address.
            </p>
          </div>

          {/* Form Area */}
          <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:px-8 md:py-12 overflow-y-auto">
            <div className="w-full flex flex-col gap-y-2 mt-4 mb-8 items-center justify-center">
              <div className="md:hidden flex justify-center mb-6">
                <Logo className="text-5xl" />
              </div>
              <p className="text-2xl mt-4 font-semibold text-foreground">Invalid Request</p>
            </div>

            <div className="w-full flex-1 flex flex-col justify-center text-center">
              <p className="text-sm text-muted-foreground mb-6">
                No email address provided for verification.
              </p>
            </div>

            <div className="w-full text-center mt-6">
              <div className="flex flex-row gap-2 justify-center items-center text-sm text-muted-foreground">
                <Link href="/signup" className="text-primary hover:underline font-medium">← Back to Sign Up</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="flex flex-col md:flex-row h-full w-full max-w-225 md:h-150 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">

        {/* Welcome Panel */}
        <div className="hidden md:flex w-1/2 bg-muted relative flex-col items-center justify-center p-8 text-center bg-linear-to-br from-primary/5 via-transparent to-transparent">
          <Logo className="text-8xl" />
          <p className="mt-6 text-muted-foreground max-w-xs">
            You're almost there! Let's verify your email address to get started.
          </p>
        </div>

        {/* Form Area */}
        <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:px-8 md:py-12 overflow-y-auto">
          <div className="w-full flex flex-col gap-y-2 mt-4 mb-8 items-center justify-center text-center">
            <div className="md:hidden flex justify-center mb-6">
              <Logo className="text-5xl" />
            </div>
            <p className="text-2xl mt-4 font-semibold text-foreground">Verify Your Email</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please enter the verification code we've sent to<br />
              <span className="font-medium text-primary">{email}</span>
            </p>
          </div>

          <div className="w-full flex-1 flex flex-col justify-center">
            <VerifyEmailForm email={email} />
          </div>

          <div className="w-full text-center mt-6">
            <div className="flex flex-row gap-2 justify-center items-center text-sm text-muted-foreground">
              <Link href="/signup" className="text-primary hover:underline font-medium">← Back</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
