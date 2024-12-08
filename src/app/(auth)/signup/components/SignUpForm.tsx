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

export default function SignUpForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

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
      const { error } = await signUp(values);
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
                <FormMessage/>
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
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-gray-800">Email</FormLabel>
                <FormMessage/>
              </div>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Email"
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
                <FormMessage/>
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
        <FormField
          name="confirmPassword"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-10"> 
                <FormLabel className="text-[16px] text-gray-800">Confirm Password</FormLabel>
                <FormMessage/>
              </div>
              <FormControl>
                <PasswordInput
                  type="password"
                  placeholder="Confirm Password"
                  {...field}
                  className="shadow-md"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="flex flex-row items-center justify-center">
        <LoadingButton
          loading={isPending}
          type="submit"
          className="px-20 rounded-[16px] bg-black py-3 mt-6 text-white text-[15px] transition-all hover:bg-white hover:text-black"
        >
          Create Account
        </LoadingButton>
        </div>
        
      </form>
    </Form>
  );
}

export { SignUpForm };
