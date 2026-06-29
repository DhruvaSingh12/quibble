"use client";

import { resetPasswordSchema, ResetPasswordValues } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { useState, useTransition } from "react";
import { resetPassword } from "./actions";
import { PasswordInput } from "@/components/ui/PasswordInput";
import LoadingButton from "@/components/LoadingButton";
import Link from "next/link";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setStatus("idle");
    setMessage("");
    
    startTransition(async () => {
      try {
        const result = await resetPassword({ ...values, token });
        if (result?.error) {
          setStatus("error");
          setMessage(result.error);
        } else {
          setStatus("success");
          setMessage("Your password has been reset successfully. You can now log in with your new password.");
          form.reset();
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
        <h2 className="text-xl font-semibold mb-2 text-emerald-600">Password Reset Successful</h2>
        <p className="mb-4 text-muted-foreground">
          {message}
        </p>
        <Link 
          href="/login" 
          className="px-6 py-2 rounded-[16px] bg-primary text-primary-foreground inline-block"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-[13px] flex flex-col items-stretch w-full px-4"
        noValidate
      >
        {status === "error" && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {message}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          Create a new password for your account.
        </div>
        
        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-foreground">New Password</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <PasswordInput
                  placeholder="Enter new password"
                  {...field}
                  className="border-border bg-card"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          name="confirmPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-foreground">Confirm Password</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <PasswordInput
                  placeholder="Confirm new password"
                  {...field}
                  className="border-border bg-card"
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex flex-row items-center justify-center">
          <LoadingButton
            loading={isPending}
            type="submit"
            className="px-20 rounded-[16px] bg-primary text-primary-foreground py-3 mt-6 text-[15px] border-0"
          >
            Reset Password
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}

export { ResetPasswordForm };
