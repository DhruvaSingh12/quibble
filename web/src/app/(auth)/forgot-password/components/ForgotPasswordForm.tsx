"use client";

import { forgotPasswordSchema, ForgotPasswordValues } from "@/lib/validation";
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
import { Input } from "@/components/ui/Input";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "./actions";
import LoadingButton from "@/components/LoadingButton";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setStatus("idle");
    setMessage("");
    
    startTransition(async () => {
      try {
        const result = await requestPasswordReset(values);
        if (result?.error) {
          setStatus("error");
          setMessage(result.error);
        } else {
          setStatus("success");
          setMessage("If an account exists with this email, we've sent a password reset link. Please check your inbox.");
          form.reset();
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    });
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
        
        {status === "success" && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm">
            {message}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </div>
        
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-foreground">Email</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Input
                  placeholder="Your email address"
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
            Send Reset Link
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}

export { ForgotPasswordForm };
