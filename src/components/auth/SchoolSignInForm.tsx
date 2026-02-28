"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function SchoolSignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleOAuth = (strategy: "oauth_google" | "oauth_facebook") => {
    if (!isLoaded || !signIn) return;

    return signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/school/sso-callback",
      redirectUrlComplete: "/school/sso-callback",
    });
  };

  const onSubmit = async (values: LoginValues) => {
    if (!isLoaded || !signIn) return;
    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back");
        router.push("/school/dashboard");
      } else {
        toast.error("Login failed", {
          description: "Please check your details and try again.",
        });
      }
    } catch (err: any) {
      const code = err.errors?.[0]?.code;
      const message = err.errors?.[0]?.message || "";
      if (
        code === "form_identifier_not_found" ||
        /not\s*found/i.test(message) ||
        /could\s*not\s*find/i.test(message)
      ) {
        toast.error("Email not found", {
          description: "Please sign up to create your School account.",
        });
      } else {
        toast.error("Login failed", {
          description: message || "Invalid email or password. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-gray-100">
      <div className="p-8">
        <div id="clerk-captcha" />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-nunito font-black text-gray-800 mb-2">
            School Login
          </h2>
          <p className="text-gray-500 font-medium">
            Access your School Dashboard
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            variant="outline"
            className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
            onClick={() => handleOAuth("oauth_google")}
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
            className="w-full rounded-xl border-2 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
            onClick={() => handleOAuth("oauth_facebook")}
          >
            <svg className="w-5 h-5 mr-2 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.66-2.797 3.592v1.4h3.67l-.418 3.667h-3.252v7.98h-4.968Z" />
            </svg>
            Facebook
          </Button>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-400 font-bold">
              Or use email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-gray-700">
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="principal@school.com"
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
                  <FormLabel className="font-bold text-gray-700">
                    Password
                  </FormLabel>
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
                      className="absolute cursor-pointer right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            

            <Button
              type="submit"
              className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white font-bold py-6 rounded-xl text-lg shadow-lg shadow-brand-purple/20 transition-all hover:scale-[1.02] cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Login"}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-4">
          <span className="text-gray-500">New school? </span>
          <a
            href="/school/sign-up"
            className="text-brand-purple font-bold hover:underline cursor-pointer"
          >
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}
