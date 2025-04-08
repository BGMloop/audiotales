import './globals.css';
import type { Metadata } from "next";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import ClientWrapper from '@/components/ClientWrapper';
import StarsBackground from "@/components/StarsBackground";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "AI Storyteller",
  description: "Create and share AI-powered stories",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen dark:bg-slate-900">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Background */}
          <StarsBackground />
          
          <Header />
          <main className="flex-1 relative z-10">
            {children}
          </main>
          <Toaster duration={8000} position="bottom-left" />
          <ClientWrapper />
        </ThemeProvider>
      </body>
    </html>
  );
}
