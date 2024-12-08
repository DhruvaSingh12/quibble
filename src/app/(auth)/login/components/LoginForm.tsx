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
      const { error } = await login(values);
      if (error) {
        setError(error);
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
        <FormField
          name="username"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-gray-800">Username</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <Input
                  placeholder="Username"
                  {...field}
                  className="shadow-md"
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
                <FormLabel className="text-[16px] text-gray-800">Password</FormLabel>
                <FormMessage />
              </div>
              <FormControl>
                <PasswordInput
                  type="password"
                  placeholder="Password"
                  {...field}
                  className="shadow-md"
                />
              </FormControl>
            </FormItem>
          )}
        />
        {error && (
          <p className="text-red-500 text-center text-sm">{error}</p>
        )}
        <div className="flex flex-row items-center justify-center">
          <LoadingButton
            loading={isPending}
            type="submit"
            className="px-20 rounded-[16px] bg-black py-3 mt-6 text-white text-[15px] transition-all hover:bg-white hover:text-black"
          >
            Log In
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}

export { LoginForm };