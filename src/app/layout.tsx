import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Nunito, Poppins, Inter } from "next/font/google";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import { Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import ScreenTimeTracker from "@/components/utils/ScreenTimeTracker";
import ScreenTimeGuard from "@/components/utils/ScreenTimeGuard";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#8B5CF6",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://qidzo.com"),
  title: "Qidzo | The Global Fun & Safe Social Learning Community for Kids",
  description: "Join Qidzo, the safest and most fun global social learning platform for kids! Share drawings, science experiments, and stories while earning magic badges.",
  keywords: [
    "kids social media",
    "safe learning for kids",
    "educational games",
    "kids community",
    "creative sharing",
    "Qidzo learning",
    "gamified education",
    "safe internet for children",
    "kids social media platoform",
    "best kids social media platoform",
    "kids learning platoform",
    "best kids learning platoform",
  ],
  authors: [{ name: "Qidzo Team" }],
  robots: "index, follow",
  
  openGraph: {
    title: "Qidzo | The Global Fun & Safe Social Learning Community for Kids",
    description: "The playful place where kids share, learn, and grow together! Join challenges, earn badges, and explore a world of creativity.",
    url: "https://qidzo.com",
    siteName: "Qidzo",
    images: [
      {
        url: "/f_q_logo.png",
        width: 1200,
        height: 630,
        alt: "Qidzo - Fun Learning & Creativity for Kids",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qidzo | Kid's Social Learning & Fun Community",
    description: "The playful place where kids share drawings, science, and stories!",
    images: ["/f_q_logo.png"],
  },

  icons: {
    icon: [
      { url: "/f.png", sizes: "32x32", type: "image/png" },
      { url: "/f.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/f.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
    <html
      lang="en"
      className={`${nunito.variable} ${poppins.variable} ${inter.variable}`}
    >
      <body className="antialiased font-inter bg-white text-gray-900">
        <Navbar />
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="39c8c727-aae0-4f3e-9a47-921df8273b31"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <ScreenTimeGuard>
          {children}
          <ScreenTimeTracker />
        </ScreenTimeGuard>
        <VisualEditsMessenger />
        <Toaster richColors closeButton position="top-right" />
      </body>
      </html>
      </ClerkProvider>
  );
}
