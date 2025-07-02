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
import { useState, useTransition, useCallback, useEffect } from "react";
import { signUp, checkUsernameAvailability, checkEmailAvailability } from "./actions";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [usernameValidation, setUsernameValidation] = useState<{ 
    status: 'idle' | 'checking' | 'available' | 'unavailable'; 
    message?: string 
  }>({ status: 'idle' });
  const [emailValidation, setEmailValidation] = useState<{ 
    status: 'idle' | 'checking' | 'available' | 'unavailable'; 
    message?: string 
  }>({ status: 'idle' });
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

  // Debounced validation functions
  const checkUsername = useCallback(
    async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameValidation({ status: 'idle' });
        return;
      }

      setUsernameValidation({ status: 'checking' });
      
      try {
        const result = await checkUsernameAvailability(username);
        if (result.available) {
          setUsernameValidation({ status: 'available', message: 'Username is available!' });
        } else {
          setUsernameValidation({ status: 'unavailable', message: result.error });
        }
      } catch (error) {
        setUsernameValidation({ status: 'unavailable', message: 'Unable to check username availability.' });
      }
    },
    []
  );

  const checkEmail = useCallback(
    async (email: string) => {
      if (!email || !email.includes("@")) {
        setEmailValidation({ status: 'idle' });
        return;
      }

      setEmailValidation({ status: 'checking' });
      
      try {
        const result = await checkEmailAvailability(email);
        if (result.available) {
          setEmailValidation({ status: 'available', message: 'Email is available!' });
        } else {
          setEmailValidation({ status: 'unavailable', message: result.error });
        }
      } catch (error) {
        setEmailValidation({ status: 'unavailable', message: 'Unable to check email availability.' });
      }
    },
    []
  );

  useEffect(() => {
    const username = form.watch("username");
    if (!username) {
      setUsernameValidation({ status: 'idle' });
      return;
    }

    if (username.length > 20) {
      setUsernameValidation({ status: 'unavailable', message: 'Username must not exceed 20 characters.' });
      return;
    }

    if (/\s/.test(username)) {
      setUsernameValidation({ status: 'unavailable', message: 'Username must not contain spaces.' });
      return;
    }

    if (!/^[a-zA-Z_]/.test(username)) {
      setUsernameValidation({ status: 'unavailable', message: 'Username must start with a letter or underscore.' });
      return;
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(username)) {
      setUsernameValidation({ status: 'unavailable', message: 'Username can only contain letters, numbers, underscores, and hyphens.' });
      return;
    }

    if (username.length < 3) {
      setUsernameValidation({ status: 'idle' });
      return;
    }

    const timer = setTimeout(() => {
      checkUsername(username);
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [form.watch("username"), checkUsername]);

  useEffect(() => {
    const email = form.watch("email");
    if (!email || !email.includes("@")) {
      setEmailValidation({ status: 'idle' });
      return;
    }

    const timer = setTimeout(() => {
      checkEmail(email);
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [form.watch("email"), checkEmail]);

  async function onSubmit(values: SignUpValues) {
    setError(undefined);
    startTransition(async () => {
      try {
        const result = await signUp(values);
        if (result?.error) {
          setError(result.error);
        } else if (result?.requiresVerification && result?.email) {
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
        className="space-y-[10px] flex flex-col items-stretch w-full px-4"
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
              <div className="flex flex-row items-start justify-between gap-8"> 
                <FormLabel className="text-[16px] text-foreground">Username</FormLabel>
                <FormMessage/>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Username"
                    {...field}
                    className={`border-border bg-card focus:ring-ring ${
                      usernameValidation.status === 'available' ? 'border-primary' :
                      usernameValidation.status === 'unavailable' ? 'border-destructive' : ''
                    }`}
                    onBlur={() => {
                      if (field.value && field.value.length >= 3) {
                        checkUsername(field.value);
                      }
                    }}
                  />
                  {usernameValidation.status === 'checking' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {usernameValidation.status === 'available' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary">
                      ✓
                    </div>
                  )}
                  {usernameValidation.status === 'unavailable' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-destructive">
                      ✗
                    </div>
                  )}
                </div>
              </FormControl>
              {usernameValidation.message && (
                <p className={`text-sm mt-1 ${
                  usernameValidation.status === 'available' ? 'text-primary' : 'text-destructive'
                }`}>
                  {usernameValidation.message}
                </p>
              )}
            </FormItem>
          )}
        />
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-row items-start justify-between gap-8"> 
                <FormLabel className="text-[16px] text-foreground">Email</FormLabel>
                <FormMessage/>
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email"
                    {...field}
                    className={`border-border bg-card focus:ring-ring ${
                      emailValidation.status === 'available' ? 'border-primary' :
                      emailValidation.status === 'unavailable' ? 'border-destructive' : ''
                    }`}
                    onBlur={() => {
                      if (field.value && field.value.includes("@")) {
                        checkEmail(field.value);
                      }
                    }}
                  />
                  {emailValidation.status === 'checking' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
                    </div>
                  )}
                  {emailValidation.status === 'available' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary">
                      ✓
                    </div>
                  )}
                  {emailValidation.status === 'unavailable' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-destructive">
                      ✗
                    </div>
                  )}
                </div>
              </FormControl>
              {emailValidation.message && (
                <p className={`text-sm ${
                  emailValidation.status === 'available' ? 'text-primary' : 'text-destructive'
                }`}>
                  {emailValidation.message}
                </p>
              )}
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
            disabled={
              isPending || 
              usernameValidation.status === 'unavailable' || 
              emailValidation.status === 'unavailable' ||
              usernameValidation.status === 'checking' ||
              emailValidation.status === 'checking'
            }
            className="px-20 rounded-[16px] bg-primary text-primary-foreground py-3 mt-6 text-[15px] border-0 disabled:opacity-50"
          >
            Send OTP
          </LoadingButton>
        </div>
        
      </form>
    </Form>
  );
}

export { SignUpForm };
