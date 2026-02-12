"use client";

import { useState, useEffect } from "react";
import { useSignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Enter your password"),
});

type Values = z.infer<typeof schema>;

export default function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Bouncer: Redirect if already logged in
  useEffect(() => {
    if (isLoaded && user) {
        // If user is already logged in, redirect to dashboard immediately
        router.replace("/parent/dashboard");
    }
  }, [isLoaded, user, router]);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: Values) => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const res = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        toast.success("Welcome back! 👋", {
          description: "It's great to see you again.",
        });
        router.push("/");
      } else if (res.status === "needs_first_factor" || res.status === "needs_second_factor") {
        // This often happens when a user signed up with Google/Facebook and tries to use a password
        toast.error("Social Login Detected! 🌐", {
          description: "It looks like you usually log in with Google or Facebook. Please use the social login buttons above!",
          duration: 6000,
        });
      } else {
        toast.error("Sign in incomplete", {
          description: "Please check your email for further instructions.",
        });
      }
    } catch (err: any) {
      // console.error(JSON.stringify(err, null, 2)); // Removed console error
      
      const errors = err.errors || [];
      const errorMsg = errors.length > 0 ? errors[0].message : "Invalid credentials";
      const errorCode = errors.length > 0 ? errors[0].code : "";

      // Custom messages based on error codes
      let userMsg = "Invalid email or password.";
      
      if (errorCode === "form_identifier_not_found") {
        userMsg = "No account found with this email.";
      } else if (errorCode === "password_incorrect") {
        userMsg = "Incorrect password. Please try again.";
      } else if (errorCode === "too_many_attempts") {
        userMsg = "Too many failed attempts. Please try again later.";
      } else if (errorCode === "user_already_exists" || errorCode === "identifier_already_in_use") {
        userMsg = "This email is already registered with a password. Please use your email and password below.";
      } else if (errorCode === "strategy_for_user_invalid") {
        userMsg = "Social login detected! Please use Google or Facebook to sign in.";
      } else if (errorMsg) {
        userMsg = errorMsg;
      }

      toast.error("Login Failed 🛑", {
        description: userMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (strategy: 'oauth_google' | 'oauth_facebook') => {
    if (!isLoaded) return;
    
    return signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-gray-100">
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-nunito font-black text-gray-800 mb-2">
            Parents Login <span className="inline-block ml-2 text-brand-purple">🔐</span>
          </h2>
          <p className="text-gray-500 font-medium">Access your dashboard</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
                variant="outline" 
                className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => handleOAuth('oauth_google')}
            >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Google
            </Button>
            <Button 
                variant="outline" 
                className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900"
                onClick={() => handleOAuth('oauth_facebook')}
            >
                <svg className="w-5 h-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.592v1.4h3.67l-.418 3.667h-3.252v7.98h-4.968Z" />
                </svg>
                Facebook
            </Button>
        </div>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500 font-bold tracking-wider">Or continue with</span>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="parent@example.com"
                      {...field}
                      className="rounded-xl border-2 focus:border-brand-purple"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-gray-700">Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        {...field}
                        className="rounded-xl border-2 focus:border-brand-purple pr-10"
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
            </Button>
          </form>
        </Form>
        <div className="text-center mt-4">
          <span className="text-gray-500">No account? </span>
          <a href="/sign-up" className="text-brand-purple font-bold hover:underline">
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

