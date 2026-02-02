"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      } else {
        // console.log(JSON.stringify(res, null, 2)); // Removed console log
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

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-gray-100">
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-nunito font-black text-gray-800 mb-2">
            Parents Login <span className="inline-block ml-2 text-brand-purple">🔐</span>
          </h2>
          <p className="text-gray-500 font-medium">Access your dashboard</p>
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

