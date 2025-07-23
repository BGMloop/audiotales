import { BookOpen, FilePen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// NavIconButton component for reusable navigation icons
interface NavIconButtonProps {
  href: string;
  label: string;
  icon: React.ElementType;
}

function NavIconButton({ href, label, icon: Icon }: NavIconButtonProps) {
  return (
    <Button variant="outline" size="icon" asChild aria-label={label}>
      <Link href={href}>
        <Icon className="h-5 w-5" />
      </Link>
    </Button>
  );
}

function Header() {
  return (
    <header className="container mx-auto py-4 md:py-6 border-b border-border">
      <div className="flex justify-between items-center">
        {/* Brand Section */}
        <Link href="/" className="flex flex-col items-start group">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white">
            AudioTales AI
          </h1>
          {/* Tagline using spans for better semantics */}
          <div className="flex flex-wrap space-x-2 text-lg md:text-xl lg:text-2xl text-muted-foreground mt-1">
            <span>Your stories,</span>
            <span className="relative inline-block px-2 py-0.5 bg-primary text-primary-foreground rounded-md -rotate-1 transform">
              Illustrated & Narrated!
            </span>
          </div>
        </Link>

        {/* Navigation Icons Section */}
        <nav className="flex items-center space-x-2 md:space-x-3">
          <NavIconButton 
            href="/" 
            label="Create New Story" 
            icon={FilePen} 
          />
          <NavIconButton 
            href="/stories" 
            label="View Story Library" 
            icon={BookOpen} 
          />
        </nav>
      </div>
    </header>
  );
}

export default Header;
