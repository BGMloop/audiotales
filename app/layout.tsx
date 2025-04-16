import './globals.css';
import type { Metadata } from "next";
import Header from "@/components/Header";
import { ThemeProvider } from "@/components/ThemeProvider";
import ClientProviders from "@/components/ClientComponents";
import { AudioProvider } from "@/lib/AudioContext";

export const metadata: Metadata = {
  title: {
    default: "AudioTales AI",
    template: "%s | AudioTales AI",
  },
  description: "Create and share magical AI-powered children's stories with illustrations and narration. Turn your ideas into visual and audio tales.",
  keywords: ["AI stories", "children's stories", "audio stories", "story generation", "AI narration"],
  openGraph: {
    title: "AudioTales AI - Magical AI-Powered Children's Stories",
    description: "Create and share magical AI-powered children's stories with illustrations and narration",
    type: "website",
    locale: "en_US",
    url: "https://audiotales.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "AudioTales AI",
    description: "Create and share magical AI-powered children's stories with illustrations and narration",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AudioProvider>
            <ClientProviders />
            <Header />
            <main className="flex-1 w-full max-w-screen-2xl mx-auto">
              {children}
            </main>
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
