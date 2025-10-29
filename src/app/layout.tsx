import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/toaster";
import { PreviewDeploymentDetector } from "@/components/PreviewDeploymentDetector";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PromptEasy - LLM Prompt Management System",
  description: "Manage, organize, and improve your LLM prompts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className={inter.className}>
        <Providers>
          <PreviewDeploymentDetector />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
