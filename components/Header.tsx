import { BookOpen, PenLine } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

function Header() {
  return (
    <header className="relative p-16 text-center">
      <Link href="/">
        <h1 className="text-6xl font-black">AudioTales AI</h1>
        <div className="flex space-x-5 text-3xl lg:text-5xl justify-center whitespace-nowrap">
          <h2>Bringing your stories</h2>
          <div className="relative">
            <div className="absolute bg-purple-500 -left-2 -top-1 -bottom-1 -right-2 md:-left-3 md:-top-0 md:-bottom-0 md:-right-3 -rotate-1 h-" />
            <div className="relative text-white">To life!</div>
          </div>
        </div>
      </Link>

      <div className="absolute -top-5 right-5 flex space-x-2">
        <Link href="/">
          <PenLine className="w-8 h-8 lg:w-10 lg:h-10 mx-auto text-purple-500 mt-10 border border-purple-500 p-2 rounded-md hover:opacity-50 cursor-pointer " />
        </Link>

        <Link href="/stories">
          <BookOpen className="w-8 h-8 lg:w-10 lg:h-10 mx-auto text-purple-500 mt-10 border border-purple-500 p-2 rounded-md  hover:opacity-50 cursor-pointer" />
        </Link>

        <ThemeToggle />
      </div>

      {/* <p className="italic mt-2">
          Combine Several AI tools with{" "}
          <span className="text-purple-500">GPTScript</span>, a framework that
          allows LLMs to operate & interact with multiple various systems.
        </p> */}
    </header>
  );
}

export default Header;
