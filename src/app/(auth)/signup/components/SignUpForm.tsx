"use client";

import { signUpSchema, SignUpValues } from "@/lib/validation";
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
import LoadingButton from "@/components/LoadingButton";
import { useState, useTransition } from "react";
import { signUp } from "./actions";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpValues) {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await signUp(values);
        if (result?.error) {
          setError(result.error);
        } else if (result?.requiresVerification && result?.email) {
          // Redirect to email verification page
          router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
        }
      } catch (error) {
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
          <div className="text-center text-destructive text-base">
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
                <FormMessage/>
              </div>
              <FormControl>
                <Input
                  placeholder="Username"
                  {...field}
                  className="border-border bg-card focus:ring-ring"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-foreground">Email</FormLabel>
                <FormMessage/>
              </div>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email"
                  {...field}
                  className="border-border bg-card focus:ring-ring"
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
                <FormMessage/>
              </div>
              <FormControl>
                <PasswordInput
                  type="password"
                  placeholder="Password"
                  {...field}
                  className="border-border bg-card focus:ring-ring"
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
                <FormMessage/>
              </div>
              <FormControl>
                <PasswordInput
                  type="password"
                  placeholder="Confirm Password"
                  {...field}
                  className="border-border bg-card focus:ring-ring"
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
            Create Account
          </LoadingButton>
        </div>
        
      </form>
    </Form>
  );
}

export { SignUpForm };
