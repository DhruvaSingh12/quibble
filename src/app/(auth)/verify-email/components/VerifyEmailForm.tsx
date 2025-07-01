"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/Button";
import LoadingButton from "@/components/LoadingButton";
import { verifyEmail, resendVerificationEmail } from "../actions";
import { useRouter } from "next/navigation";

interface VerifyEmailFormProps {
  email: string;
}

export default function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = numericValue;
      setOtp(newOtp);
      setError(undefined);

      if (numericValue && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 6) newOtp[i] = digit;
        });
        setOtp(newOtp);
        
        const nextEmptyIndex = newOtp.findIndex((digit, i) => i >= digits.length);
        if (nextEmptyIndex !== -1) {
          inputRefs.current[nextEmptyIndex]?.focus();
        } else {
          inputRefs.current[5]?.focus();
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      try {
        const result = await verifyEmail(email, otpString);
        if (result.error) {
          setError(result.error);
        } else if (result.success) {
          setSuccess("Email verified successfully! Redirecting...");
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      } catch (error) {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const handleResend = () => {
    setError(undefined);
    setSuccess(undefined);

    startResendTransition(async () => {
      try {
        const result = await resendVerificationEmail(email);
        if (result.error) {
          setError(result.error);
        } else if (result.success) {
          setSuccess("Verification code resent successfully!");
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      } catch (error) {
        setError("Failed to resend verification email.");
      }
    });
  };

  return (
    <div className="space-y-[13px] flex flex-col items-stretch w-full px-4">
      {error && (
        <div className="text-center text-destructive text-base">
          {error}
        </div>
      )}
      
      {success && (
        <div className="text-center text-primary text-base">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-[13px]" noValidate>
        <div>
          <div className="flex flex-row items-center justify-center gap-4 mb-2"> 
            <label className="text-[16px] text-foreground">Verification Code</label>
          </div>
          
          <div className="flex justify-center gap-3 mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-mono border-2 border-border bg-card rounded-lg focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all"
                maxLength={1}
                autoComplete="off"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-row items-center justify-center">
          <LoadingButton
            type="submit"
            loading={isPending}
            disabled={otp.join("").length !== 6}
            className="px-20 rounded-[16px] bg-primary text-primary-foreground py-3 mt-6 text-[15px] border-0"
          >
            {isPending ? "Verifying..." : "Verify Email"}
          </LoadingButton>
        </div>

        <div className="text-center mt-4">
          <p className="text-base text-foreground mb-2">
            Didn't receive the code?
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isResending}
            className="text-base px-8 py-2 rounded-[12px] border-border"
          >
            {isResending ? "Resending..." : "Resend Code"}
          </Button>
        </div>
      </form>
    </div>
  );
}
