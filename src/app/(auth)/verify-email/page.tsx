import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import VerifyEmailForm from "./components/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify Email",
};

interface VerifyEmailPageProps {
  searchParams: { email?: string };
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email } = searchParams;

  if (!email) {
    return (
      <main className="h-screen flex items-center justify-center p-4 bg-[url('/auth-back.jpg')] bg-cover bg-center bg-background text-foreground">
        <div className="flex flex-col md:flex-row h-full max-h-[640px] w-full max-w-[1024px] overflow-hidden rounded-3xl bg-white/30 backdrop-blur-sm shadow-xl">
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
              <p className="text-3xl">Invalid Request</p>
            </div>

            <div className="w-full text-center">
              <p className="text-lg text-foreground mb-6">
                No email address provided for verification.
              </p>
            </div>

            <div className="w-full text-center">
              <div className="flex flex-row gap-2 justify-center mb-4 items-center text-lg text-foreground">
                <Link href="/signup" className="text-primary hover:underline">← Back to Sign Up</Link>
              </div>
            </div>
          </div>

          <div className="hidden md:block md:w-1/2 relative">
            <Image
              src="/signup-image.jpg"
              alt="Email verification illustration"
              fill
              className="object-cover rounded-r-3xl"
              priority
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex items-center justify-center p-4 bg-[url('/auth-back.jpg')] bg-cover bg-center bg-background text-foreground">
      <div className="flex flex-col md:flex-row h-full max-h-[640px] w-full max-w-[1024px] overflow-hidden rounded-3xl bg-white/30 backdrop-blur-sm shadow-xl">
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
            <p className="text-3xl text-foreground">Verify Your Email</p>
            <div className="text-center mt-2">
              <p className="text-lg text-foreground">
                Please enter the verification code we've sent to
              </p>
              <p className="text-lg font-medium text-primary">{email}</p>
            </div>
          </div>

          <div className="w-full">
            <VerifyEmailForm email={email} />
          </div>

          <div className="w-full text-center">
            <div className="flex flex-row gap-2 justify-center mb-4 items-center text-lg text-foreground">
              <Link href="/signup" className="text-foreground hover:underline">← Back</Link>
            </div>
          </div>
        </div>

        <div className="hidden md:block md:w-1/2 relative">
          <Image
            src="/signup-image.jpg"
            alt="Email verification illustration"
            fill
            className="object-cover rounded-r-3xl"
            priority
          />
        </div>
      </div>
    </main>
  );
}
