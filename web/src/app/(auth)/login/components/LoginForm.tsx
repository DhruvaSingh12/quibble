"use client";

import { loginSchema, LoginValues } from "@/lib/validation";
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
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { useState, useTransition } from "react";
import { login } from "./actions";
import { PasswordInput } from "@/components/ui/PasswordInput";
import LoadingButton from "@/components/LoadingButton";

export default function LoginForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await login(values);
        if (result?.error) {
          setError(result.error);
        } else {
          window.location.href = "/";
        }
      } catch {
        setError("Something went wrong. Please try again.");
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
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        
        <FormField
          name="username"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-foreground">Username</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Input
                  placeholder="Username"
                  {...field}
                  className="border-border bg-card"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="password"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-foreground">Password</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <PasswordInput
                  type="password"
                  placeholder="Password"
                  {...field}
                  className="border-border bg-card"
                />
              </FormControl>
              <div className="flex justify-end mt-1">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </FormItem>
          )}
        />
        <div className="flex flex-row items-center justify-center">
          <LoadingButton
            loading={isPending}
            type="submit"
            className="px-20 rounded-[16px] bg-primary text-primary-foreground py-3 mt-6 text-[15px] border-0"
          >
            Log In
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}

export { LoginForm };