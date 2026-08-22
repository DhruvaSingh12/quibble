import { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import LoginForm from "./components/LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="flex flex-col md:flex-row h-full w-full max-w-225 md:h-150 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
        
        {/* Welcome Panel (Left for Login) */}
        <div className="hidden md:flex w-1/2 bg-muted relative flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <Logo className="text-8xl" />
          <p className="mt-6 text-muted-foreground max-w-xs">
            Welcome back to Quibble. Enter your details to access your account.
          </p>
        </div>
        
        {/* Form Area */}
        <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:px-8 md:py-12 overflow-y-auto">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-muted rounded-lg h-10 p-1 mb-8 flex-none">
            <Link href="/login" className="flex items-center justify-center bg-background text-foreground shadow-sm rounded-lg text-sm font-medium">
              Log In
            </Link>
            <Link href="/signup" className="flex items-center justify-center text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              Sign Up
            </Link>
          </div>
          
          <div className="w-full flex-1 flex flex-col justify-center">
            <div className="md:hidden flex justify-center mb-6">
              <Logo className="text-5xl" />
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
