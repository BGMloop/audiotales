import StoryWriter from "@/components/StoryWriter";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/images/logo.png";
import Image from "next/image";

export default function Home() {
  return (
    <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-var(--header-height,80px))]">
      {/* Brand & CTA Column */}
      <div className="bg-gradient-to-br from-primary/90 to-primary-dark p-6 md:p-10 lg:p-12 flex flex-col justify-start items-center order-1 lg:-order-1 min-h-full">
        {/* Logo & Content Container */}
        <div className="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto mt-32">
          {/* Logo Container */}
          <div className="w-full aspect-square max-w-[110px] xl:max-w-[120px] relative flex items-center justify-center">
            <Image
              src={Logo}
              alt="AudioTales AI - Create magical AI-powered stories"
              fill
              priority
              className="object-contain scale-[4] transform-gpu"
              sizes="(max-width: 768px) 150vw, (max-width: 1200px) 150vw, 12800px"
            />
          </div>

          {/* Tagline */}
          <div className="mt-48">
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 text-center leading-relaxed font-light">
              Transform your imagination into enchanting stories with AI-powered narration
            </p>
          </div>

          {/* CTA Button Container */}
          <div className="w-full max-w-2xl mx-auto px-4 relative z-10 mt-32">
            <Button
              asChild
              size="lg"
              className="w-full py-6 text-xl md:text-2xl font-semibold bg-accent hover:bg-accent/90 text-white
                       transition-all duration-300 shadow-lg hover:shadow-xl rounded-full relative z-10"
            >
              <Link href="/stories" className="flex items-center justify-center gap-2 w-full h-full">
                Explore Story Library
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Story Writer Column */}
      <div className="bg-background p-6 md:p-10 lg:p-12">
        <div className="h-full max-w-2xl mx-auto">
          <StoryWriter />
        </div>
      </div>
    </section>
  );
}
